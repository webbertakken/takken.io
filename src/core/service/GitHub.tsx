import { Octokit } from 'octokit'
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types'

const octokit = new Octokit()

export type Authenticated = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.rest.users.getAuthenticated
>
export type Gist = GetResponseDataTypeFromEndpointMethod<typeof octokit.rest.gists.get>
export type Gists = GetResponseDataTypeFromEndpointMethod<typeof octokit.rest.gists.list>
