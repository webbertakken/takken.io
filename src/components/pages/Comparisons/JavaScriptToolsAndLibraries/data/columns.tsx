export const columns = [
  {
    title: 'Purpose',
    dataIndex: 'purpose',
    key: 'purpose',
  },
  {
    title: 'Choice',
    dataIndex: 'choices',
    key: 'purpose',
    render: (choices) => {
      const render = []
      for (const choice of choices) {
        choice.url
          ? render.push(
              <a target="_blank" href={choice.url}>
                {choice.name}
              </a>,
            )
          : render.push(choice.name)
        render.push(', ')
      }
      render.pop()
      return render
    },
  },
  {
    title: 'Reason',
    dataIndex: 'reasons',
    key: 'purpose',
    render: (reasons) => {
      return reasons.map((reason) => {
        return reason.url ? (
          <a target="_blank" href={reason.url}>
            <code>{reason.name}</code>
          </a>
        ) : (
          <code>{reason.name}</code>
        )
      })
    },
  },
]
