import React from 'react'
import Layout from '@theme/Layout'
import Image from '@theme/IdealImage'
import { FaGithub, FaLinkedinIn, FaStackOverflow, FaTwitter, FaAt } from 'react-icons/fa6'
// import HomepageFeatures from '@site/src/components/HomepageFeatures'
import Card from '@site/src/components/Home/Card/Card'

const Index = (): JSX.Element => {
  return (
    <Layout title="About me" description="About me">
      <div className="flex flex-col md:flex-row gap-8 p-8 lg:gap-12 lg:p-12">
        <div className="flex flex-col w-auto md:w-88 shrink-0 grow-0 self-center md:self-start ">
          <h1 className="text-2xl">Hey, I'm Webber! 👋🏻</h1>

          <p>
            I'm a techie from Holland with a passion for web technologies. On this website I share
            my notes, thoughts, ideas, and projects.
          </p>

          <div style={{ marginBottom: '1em' }}>
            <Image
              className="[&:not(dialog_&)_img]:rounded-lg"
              img={require('@site/src/assets/webber.jpg')}
            />
          </div>

          <p className="text-center mb-4">Webber Webbink</p>

          <div className="flex justify-center items-center mt-4 gap-4 [&_a]:text-[#989586] [&_a:hover]:text-pink-dark [&_a:hover]:animate-pulse">
            <a target="_blank" rel="noreferrer" href="mailto:webber@takken.io">
              <FaAt size={32} />
            </a>
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

        <div className="flex grow flex-row flex-wrap gap-8">
          <Card title="Projects">
            <Card.Item>
              🎮{' '}
              <a href="https://minis.gg" target="_blank" rel="noreferrer">
                Minis.gg
              </a>{' '}
              (free gaming platform)
            </Card.Item>
            <Card.Item>
              📺{' '}
              <a href="https://github.com/webbertakken/streamer" target="_blank" rel="noreferrer">
                Streamer
              </a>{' '}
              (software)
            </Card.Item>
            <Card.Item>
              🌍{' '}
              <a href="https://game.ci" target="_blank" rel="noreferrer">
                GameCI
              </a>{' '}
              (open source community)
            </Card.Item>
          </Card>

          <Card title="Latest posts">
            <Card.Item>
              📖{' '}
              <a href="/blog/seamless-windows-linux-development">
                Seamless Windows-Linux development
              </a>
            </Card.Item>
            <Card.Item>
              📖 <a href="/blog/a-modern-terminal-for-windows">A modern terminal for Windows</a>
            </Card.Item>
            <Card.Item>
              📖{' '}
              <a href="/blog/building-an-energy-efficient-server">
                Building an energy efficient server
              </a>
            </Card.Item>
            <Card.Item>
              📖 <a href="/blog/cleaning-a-cpu">Cleaning a CPU</a>
            </Card.Item>
            <Card.Item>
              📖 <a href="/blog/sweet-transition">Sweet Transition</a>
            </Card.Item>
          </Card>

          <Card title="About me">
            <Card.Item>⚙️ Techie</Card.Item>
            <Card.Item>💡 Curious</Card.Item>
            <Card.Item>🎯 Driven</Card.Item>
            <Card.Item>🙂 Mindful</Card.Item>
            <Card.Item>🧡 Compassionate</Card.Item>
            <Card.Item>🏡 Introvert</Card.Item>
            <Card.Item>🧠 Neurodiverse</Card.Item>
            <Card.Item>🌻 Optimistic</Card.Item>
            <Card.Item>😴 Dreamer</Card.Item>
          </Card>

          <Card title="Likes">
            <Card.Item>✨ Novelty</Card.Item>
            <Card.Item>⛴️ Ferries</Card.Item>
            <Card.Item>📚 Audiobooks</Card.Item>
            <Card.Item>🎮 Multiplayer games</Card.Item>
            <Card.Item>💁🏻 Meeting new people</Card.Item>
            <Card.Item>💬 Conversation</Card.Item>
            <Card.Item>🧠 Learning new things</Card.Item>
            <Card.Item>🚀 Being able to make a difference</Card.Item>
          </Card>

          <Card title="Passions">
            <Card.Item>🔨 Building things</Card.Item>
            <Card.Item>👨🏻‍💻 Software engineering</Card.Item>
            <Card.Item>🫴 Helping other people learn and grow</Card.Item>
            <Card.Item>💬 Stimulating positive narratives for a more impactful community</Card.Item>
          </Card>

          <Card title="Aspirations">
            <Card.Item>
              👨‍🍳 Making the best home made spring rolls in Holland by the year 2040
            </Card.Item>
            <Card.Item>🧙‍♂️ Become a full-time open sourcerer</Card.Item>
            <Card.Item>🎮 Publishing a PC game on Steam</Card.Item>
            <Card.Item>
              🤖 Start a company where every interacting employee is an instance of AI
            </Card.Item>
          </Card>

          <Card title="Hobbies">
            <Card.Item>👨🏻‍💻 Coding</Card.Item>
            <Card.Item>⛷️ Skiing</Card.Item>
            <Card.Item>🤿 Scuba diving</Card.Item>
            <Card.Item>🏃🏻‍♂️ Running</Card.Item>
            <Card.Item>🎸 Ukulele</Card.Item>
          </Card>

          <Card title="Guilty pleasures">
            <Card.Item>🍫 Eating Snickers white chocolate ice cream in winter</Card.Item>
            <Card.Item>🚿 Taking long showers</Card.Item>
          </Card>

          <Card title="Influences">
            <Card.Item>👨🏻 Lex Fridman</Card.Item>
            <Card.Item>🧑🏾‍🦱 Naval Ravikant</Card.Item>
            <Card.Item>🧑🏻 Simon Sinek</Card.Item>
            <Card.Item>👱🏻‍♀️ Erin Meyer</Card.Item>
            <Card.Item>👨🏻‍🦲 Yuval Noah Harari</Card.Item>
            <Card.Item>👨🏼‍🦲 Martin Fowler</Card.Item>
          </Card>

          <Card title="Ideals">
            <Card.Item>🌈 Inclusivity</Card.Item>
            <Card.Item>⚖️ Nuance</Card.Item>
            <Card.Item>🧡 Practicing kindness</Card.Item>
            <Card.Item>🌱 Sustainability</Card.Item>
          </Card>

          <Card title="Movies">
            <Card.Item>🎬 Camp X-Ray</Card.Item>
            <Card.Item>🎬 The theory of everything</Card.Item>
            <Card.Item>🎬 X + Y</Card.Item>
            <Card.Item>🎬 Baahubali 2: The Conclusion</Card.Item>
            <Card.Item>🎬 Mortal Engines</Card.Item>
            <Card.Item>🎬 Shawshank Redemption</Card.Item>
          </Card>

          {/* Make sure amount of boxes is even */}
          {/*<Card title="Series">*/}
          {/*  <Card.Item>📺 Mr. Robot</Card.Item>*/}
          {/*  <Card.Item>📺 The Witcher</Card.Item>*/}
          {/*  <Card.Item>📺 Vikings</Card.Item>*/}
          {/*  <Card.Item>📺 Jericho</Card.Item>*/}
          {/*  <Card.Item>📺 The Big Bang Theory</Card.Item>*/}
          {/*  <Card.Item>📺 Suits</Card.Item>*/}
          {/*</Card>*/}

          <Card title="Books">
            <Card.Item>📚 Sapiens</Card.Item>
            <Card.Item>📚 Ikigai</Card.Item>
            <Card.Item>📚 The Culture map</Card.Item>
            <Card.Item>📚 The Chimp Paradox</Card.Item>
            <Card.Item>📚 Being Genuine: Stop Being Nice, Start Being Real</Card.Item>
            <Card.Item>📚 Never Split The Difference</Card.Item>
          </Card>
        </div>
      </div>

      {/*<HomepageFeatures />*/}
    </Layout>
  )
}

export default Index
