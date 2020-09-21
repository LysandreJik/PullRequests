import React from 'react';
import './App.css';

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = { links: [] };
		this.fetchPullRequests = this.fetchPullRequests.bind(this);

		document.addEventListener("keypress", event => {
			if (event.key === "Enter") {
			    this.fetchPullRequests();
			}
		});	}

	async fetchPullRequests() {
		let pullRequests = [];

		const date = new Date(document.getElementById("date").value);
		const repo = document.getElementById("repo").value;
		const max = parseInt(document.getElementById("max_pr").value);

		console.log("Repository", repo)

		for (let i = 1; i <= max / 100 + 1; i++) {
			console.log(i)
			const result = await fetch(`https://api.github.com/repos/${repo}/pulls?per_page=100&state=closed&page=${i}`)
			const jsonResult = await result.json();
			pullRequests.push(...jsonResult);
		}

		const links = pullRequests
			.filter(a => a.merged_at)
			.sort((a, b) => new Date(a.merged_at) - new Date(b.merged_at))
			.filter(link => new Date(link.merged_at) > date);

		this.setState({ links });
	}

	render() {
		return (
			<div className="App" onSubmit={this.fetchPullRequests}>
				<h1>Order pull requests by date merged</h1>
				<input id="repo" placeholder="org/repo" defaultValue={'huggingface/transformers'}/>
				<input id="date" placeholder="since MM/DD/YYYY" />
				<input id="max_pr" placeholder="Maximum nb of PRs to skim through"/>
				<button onClick={this.fetchPullRequests}>Show PRs</button>
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
				{/*<button id={"copy"} data-clipboard-target="#links">Copy to clipboard</button>*/}
			</div>
		);
	}
}

export default App;
