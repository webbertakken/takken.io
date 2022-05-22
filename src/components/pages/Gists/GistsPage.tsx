import React from 'react'
import DefaultLayout from '@site/src/components/layout/DefaultLayout'
import styles from '@site/src/components/pages/Blog/Posts/BlogPosts.module.scss'
import { Gists } from '@site/src/core/service/GitHub'

interface Props {
  gists: Gists
}

const GistsPage = ({ gists }: Props) => (
  <DefaultLayout>
    {(gists.length >= 1 && (
      <ul className={styles.list}>
        {gists.map(({ id, created_at, updated_at, description, files }) => {
          const title = Object.values(files)[0].filename
          const createdDate = new Date(created_at).toDateString()
          const updatedDate = new Date(updated_at).toDateString()

          return (
            <a key={id} href={`/gists/${id}`}>
              <li className={styles.post}>
                {/* Todo convert to classes after introducing tailwind */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    padding: '.75em 0',
                    opacity: 0.75,
                  }}
                >
                  <sup>Created on {createdDate}</sup>
                  <sup>Last updated on {updatedDate}</sup>
                </div>
                <h1>{title}</h1>
                <summary>{description}</summary>
              </li>
            </a>
          )
        })}
      </ul>
    )) || <div className={styles.empty}>No gists exist yet</div>}
  </DefaultLayout>
)

export default GistsPage
