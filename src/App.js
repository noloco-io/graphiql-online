import React from 'react'
import GraphiQL from 'graphiql'
import fetch from 'isomorphic-fetch'

const options = { method: 'post', headers: { 'Content-Type': 'application/json' } }
const ENDPOINT = 'https://countries.trevorblades.com/' // Initial

const defaultQuery = `
# Welcome to Noloco GraphiQL
#
# Noloco GraphiQL is an in-browser tool for writing, validating, and
# testing Noloco queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that starts
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     query userCollection{
#       userCollection {
#         totalCount
#         edges {
#           node {
#             id
#             email
#           }
#         }
#       }
#     }
#
# Keyboard shortcuts:
#
#       Run Query:  Ctrl-Enter (or press the play button above)
#
#   Auto Complete:  Ctrl-Space (or just start typing)
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

query userCollection{
  userCollection {
    totalCount
    edges {
      node {
        id
        email
      }
    }
  }
}
`

export default class App extends React.Component {
  constructor (props) {
    super(props)

    const projectName = document.location.hash.replace('#', '')
    let endpoint = ENDPOINT

    if (projectName) {
      endpoint = `https://api.portals.noloco.io/data/${projectName}`
    } else {
      this.askForProjectName()
    }

    this.state = {
      apiKey: window.localStorage.getItem('graphiql:key') || '',
      projectName,
      defaultQuery,
      endpoint,
      fetcher: this.createFetcher(endpoint)
    }

    this.chooseApiKey = this.chooseApiKey.bind(this)
  }

  askForProjectName = () => {
    const projectName = window.prompt('Please enter your project name')
    document.location = `${document.location.href}#${projectName}`
    document.location.reload()
  }

  /**
  * GraphiQL fetcher factory.
  */
  createFetcher = endpoint => param => fetch(endpoint, { ...options, headers: { ...options.headers, Authorization: `Bearer ${this.state.apiKey}` }, body: JSON.stringify(param) })
    .then(response => response.json())

  /**
   * Change endpoint and fetcher.
   */
  changeApiKey = apiKey => {
    window.localStorage.setItem('graphiql:key', apiKey)
    this.setState({
      apiKey,
    })
  }

  /**
   * validate end change endpoint, but only when new one is valid url.
   */
  validateAndChangeEndpoint = endpoint => this.changeApiKey(endpoint);

  /**
   * Promp user for new api key.
   */
  chooseApiKey () {
    this.validateAndChangeEndpoint(
      window.prompt(`Enter your Portal API Key from https://${this.state.projectName}.noloco.co/_/settings/integrations`, this.state.apiKey)
    )
  }

  setRef = c => (this.graphiql = c)

  render () {
    return (
      <div id='container'>
        <GraphiQL
          ref={ this.setRef }
          fetcher={ this.state.fetcher }
          defaultQuery={ this.state.defaultQuery }
        >
          <GraphiQL.Logo>
            <a href='https://noloco.io' title='See noloco'>
              <img src="https://uploads-ssl.webflow.com/6145a64d8a08a13f1a8040f7/614819338a8b0442c6ab2572_infinity%20black%402x.png" height="32" alt="Noloco Logo"/>
            </a>
          </GraphiQL.Logo>

          <GraphiQL.Toolbar>
            <GraphiQL.Button
              label='Change API token'
              title='Change API token'
              onClick={ this.chooseApiKey }
            />
            <span>Endpoint: <strong>{ this.state.endpoint }</strong></span>
          </GraphiQL.Toolbar>
        </GraphiQL>
      </div>
    )
  }
}
