interface ListProps {
  children: React.ReactNode
  ordered?: boolean
}

const List = (props: ListProps) => {
  const { ordered, children } = props

  return ordered ? <ol>{children}</ol> : <ul>{children}</ul>
}

List.defaultProps = {
  ordered: false,
}

interface ItemProps {
  children: React.ReactNode
}

const ListItem = (props: ItemProps) => {
  const { children } = props

  return <li>{children}</li>
}

export { List, ListItem }
