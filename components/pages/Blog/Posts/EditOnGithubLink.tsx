import { AiOutlineGithub } from 'react-icons/all'

const EditOnGithubLink = ({ slug }) => {
  const repoPath = 'https://github.com/webbertakken/takken.io'
  const editPath = 'edit/main'
  const filePath = `posts/${slug}.md`

  const href = slug ? `${repoPath}/${editPath}/${filePath}` : `${repoPath}`

  return (
    <a href={href} type="link">
      <AiOutlineGithub color="rgba(255,255,255,0.85)" />
      <span style={{ paddingLeft: 8 }}>Edit on GitHub</span>
    </a>
  )
}

export default EditOnGithubLink
