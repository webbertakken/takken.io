import { Octokit } from 'octokit'
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types'

const octokit = new Octokit()

export type Authenticated = GetResponseDataTypeFromEndpointMethod<typeof octokit.rest.users.getAuthenticated>
export type Gist = GetResponseDataTypeFromEndpointMethod<typeof octokit.rest.gists.get>
export type Gists = GetResponseDataTypeFromEndpointMethod<typeof octokit.rest.gists.list>

export default class GitHub {
  private static instance: InstanceType<typeof Octokit>

  public static getInstance() {
    if (this.instance) return this.instance

    this.instance = new Octokit({ auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN })

    return this.instance
  }

  public static async getAuthenticated(): Promise<Authenticated> {
    const response = await this.getInstance().rest.users.getAuthenticated()

    return response.data
  }

  public static async getUsername() {
    const authenticated = await this.getAuthenticated()

    return authenticated?.login || null
  }

  public static async getMyGists(): Promise<Gists> {
    const response = await this.getInstance().rest.gists.list()

    return response.data.filter((gist) => gist.public === true)
  }

  public static async getGist(id: string) {
    const response = await this.getInstance().rest.gists.get({ gist_id: id })

    return response.data
  }
}
