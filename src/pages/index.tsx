import styles from './index.module.css'
import React from 'react'
import Layout from '@theme/Layout'
import Image from '@theme/IdealImage'
import { FaGithub, FaLinkedinIn, FaStackOverflow, FaTwitter } from 'react-icons/fa'

const Index = (): JSX.Element => {
  return (
    <Layout title="Hello" description="Hello React Page">
      <div
        className={styles.container}
        style={{
          display: 'flex',
          flexGrow: 1,
          justifyContent: 'center',
          padding: '2em',
          gap: '2em',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '340px',
            flexDirection: 'column',
          }}
        >
          <h1 className={styles.heading}>Hey, I'm Webber! 👋🏻</h1>

          <p>
            I'm a techie from Holland with a passion for web technologies. On this website I share
            my notes, thoughts, ideas, and projects.
          </p>

          <div style={{ marginBottom: '1em' }}>
            <Image className={styles.image} img={require('../assets/webber.jpg')} />
          </div>

          <div className={styles.socialLinks}>
            <a target="_blank" rel="noreferrer" href="https://twitter.com/webbertakken">
              <FaTwitter size={32} />
            </a>
            <a target="_blank" rel="noreferrer" href="https://github.com/webbertakken">
              <FaGithub size={32} />
            </a>
            <a target="_blank" rel="noreferrer" href="https://www.linkedin.com/in/webbertakken/">
              <FaLinkedinIn size={32} />
            </a>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://stackoverflow.com/users/3593896/webber"
            >
              <FaStackOverflow size={32} />
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Index
