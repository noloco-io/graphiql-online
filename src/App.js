import React from 'react'
import GraphiQL from 'graphiql'
import fetch from 'isomorphic-fetch'

const options = { method: 'post', headers: { 'Content-Type': 'application/json' } }
const ENDPOINT = 'https://countries.trevorblades.com/' // Initial

// Copies a string to the clipboard. Must be called from within an
// event handler such as click. May return false if it failed, but
// this is not always possible. Browser support for Chrome 43+,
// Firefox 42+, Safari 10+, Edge and Internet Explorer 10+.
// Internet Explorer: The clipboard feature may be disabled by
// an administrator. By default a prompt is shown the first
// time the clipboard is used (per session).
const copyToClipboard = (text) => {
  if (window.clipboardData && window.clipboardData.setData) {
      // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
    return window.clipboardData.setData("Text", text)

  }
  else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
    const textarea = document.createElement("textarea")
    textarea.textContent = text
    textarea.style.position = "fixed"  // Prevent scrolling to bottom of page in Microsoft Edge.
    document.body.appendChild(textarea)
    textarea.select()
    try {
        return document.execCommand("copy")  // Security exception may be thrown by some browsers.
    }
    catch (ex) {
        console.warn("Copy to clipboard failed.", ex)
        return prompt("Copy to clipboard: Ctrl+C, Enter", text)
    }
    finally {
        document.body.removeChild(textarea)
    }
  }
}

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
  validateAndChangeEndpoint = endpoint => this.changeApiKey(endpoint)

  /**
   * Promp user for new api key.
   */
  chooseApiKey () {
    this.validateAndChangeEndpoint(
      window.prompt(`Enter your Portal API Key from https://${this.state.projectName}.noloco.co/_/settings/integrations`, this.state.apiKey)
    )
  }

  copyRequest () {
    const { query, variables } = this.graphiql.state
    const queryObject = {
      variables: JSON.parse(variables || {}),
      query: query.replace(/\n/g, '  '),
    }
    const queryString = JSON.stringify(queryObject, undefined, 2)
    console.log(queryString)
    copyToClipboard(queryString)
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
            <GraphiQL.Button
              label='Copy to clipboard'
              title='Copy to clipboard'
              onClick={ () => this.copyRequest() }
            />
            <span className="endpoint">URL: <strong>{ this.state.endpoint }</strong></span>
          </GraphiQL.Toolbar>
        </GraphiQL>
      </div>
    )
  }
}
