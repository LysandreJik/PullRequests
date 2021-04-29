import React from 'react';
import './App.css';
import { Lion as Button } from 'react-button-loaders'

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = { repo: null, links: [], releases: [], versionSelected: null, sendState: '', skimmingThroughPRs: null };
		this.fetchPullRequests = this.fetchPullRequests.bind(this);
	}

	async fetchPullRequests() {
		this.setState({sendState: 'loading', links: [], skimmingThroughPRs: null})
		const releaseDate = new Date(this.state.versionSelected.created_at)
		const fetchUpToDate = new Date(releaseDate)
		fetchUpToDate.setMonth(fetchUpToDate.getMonth() - 1);

		console.log("Release date: ", releaseDate)
		console.log("Fetching up to: ", fetchUpToDate);

		// Compute up to when should we skim the PRs in order to get every PR merged. Skims through 100 pages at a time,
		// only fetching a PR every 100 PRs.
		let lastPrDate = new Date();
		let pageNumber = 0;
		while(lastPrDate > fetchUpToDate){
			const currentIndex = pageNumber * 100;
			const result = await fetch(`https://api.github.com/repos/${this.state.repo}/pulls?state=closed&per_page=1&page=${currentIndex}`)
			console.log(`https://api.github.com/repos/${this.state.repo}/pulls?state=closed&per_page=1&page=${currentIndex}`)
			const jsonResult= await result.json();

			if (jsonResult.length == 0) {
				break;
			}

			const currentPR = jsonResult[0]
			console.log(currentPR);
			pageNumber++;
			lastPrDate = new Date(currentPR.created_at)
		}

		console.log("Skimming up to page", pageNumber);
		console.log("Date of the PR then:", lastPrDate)
		this.setState({sendState: 'finished', skimmingThroughPRs: pageNumber * 100})

		let pullRequests = [];

		for (let i = 1; i <= pageNumber; i++) {
			console.log(i)
			const result = await fetch(`https://api.github.com/repos/${this.state.repo}/pulls?per_page=100&state=closed&page=${i}`)
			const jsonResult = await result.json();
			pullRequests.push(...jsonResult);
		}

		const links = pullRequests
			.filter(a => a.merged_at)
			.sort((a, b) => new Date(a.merged_at) - new Date(b.merged_at))
			.filter(link => new Date(link.merged_at) > releaseDate);

		this.setState({ links });
	}

	handleRepoKeyPress = async (event) => {
		if(event.key === 'Enter'){
			const result = await fetch(`https://api.github.com/repos/${document.getElementById("repo").value}/releases`)
			const jsonResult = await result.json();
			this.setState({versionSelected: null, links: [], sendState: '', skimmingThroughPRs: null, repo: document.getElementById('repo').value, releases: jsonResult})
		}
	}

	handleVersionSelect = async (event) => {
		const versionSelectedTag = document.getElementById('releases').value;
		const versionSelected = this.state.releases.filter(release => release.tag_name === versionSelectedTag)[0]
		this.setState({versionSelected, skimmingThroughPRs: null, sendState: '', links: []})
	}

	render() {
		return (
			<div className="App">
				<h1>Order pull requests by date merged</h1>
				<input
					id="repo"
					placeholder="org/repo"
					defaultValue={'huggingface/transformers'}
					onKeyPress={this.handleRepoKeyPress}
				/>
				{this.state.releases.length > 0 ?
					<div className={"selector"}>
						From version:
						<select name={"releases"} id={"releases"} onChange={this.handleVersionSelect}>
                            <option value={"none"} selected disabled hidden>Select a version</option>
							{this.state.releases
								.map((release, key) => <option
									key={key}
									value={release.tag_name}>
									{release.tag_name}
								</option>)
							}
						</select>
					</div>
                    : ""
				}
				{this.state.versionSelected != null ?
					<div className={"selector"}>
						{`Since ${
							new Date(this.state.versionSelected.created_at)
								.toLocaleString('default', {month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'})
						}`}
						<Button
							onClick={this.fetchPullRequests}
							state={this.state.sendState}
							className={'button-fetch'}
							bgColor={'orange'}
							bgLoading={'orange'}
							bgWhenFinish={'orange'}
						>Fetch</Button>
					</div>
					:
					""
				}
				<div id="links">
					{this.state.links.length > 0 ? <h1>Links</h1> : ""}
					{this.state.links.map((pull, key) => {
						return (
							<div key={key}>
								- {pull.title} #{pull.number} (@{pull.user.login})
								<br/>
							</div>
						)
					})}
				</div>
				{this.state.skimmingThroughPRs > 0 && this.state.links.length == 0 ? `Skimming through ${this.state.skimmingThroughPRs} PRs...` : ''}
			</div>
		);
	}
}

export default App;
