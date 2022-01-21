import React from 'react'
import DefaultLayout from '@/components/layout/DefaultLayout'
import styles from '@/components/pages/Blog/Posts/BlogPosts.module.scss'
import Link from 'next/link'
import { Empty } from 'antd'
import { Gists } from '@/core/services/GitHub'

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
            <Link key={id} href={`/gists/${id}`}>
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
            </Link>
          )
        })}
      </ul>
    )) || <Empty className={styles.empty} description="No gists exist yet" />}
  </DefaultLayout>
)

export default GistsPage
