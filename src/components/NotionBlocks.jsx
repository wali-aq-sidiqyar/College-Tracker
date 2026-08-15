// Renders a Notion block tree read-only. Handles the block types that show
// up in real notes (text, lists, images, code, tables, callouts...); types
// this preview doesn't fully support fall back to a plain link/label rather
// than breaking the render — see PRD/plan discussion for the full list.

const NOTION_COLORS = {
  gray: '#9db3bc',
  brown: '#c9a27a',
  orange: '#ffb84d',
  yellow: '#ffdd57',
  green: '#7bff5a',
  blue: '#5ac8ff',
  purple: '#c792ff',
  pink: '#ff8ecf',
  red: '#ff6d6d',
  gray_background: 'rgba(157, 179, 188, 0.16)',
  brown_background: 'rgba(201, 162, 122, 0.16)',
  orange_background: 'rgba(255, 184, 77, 0.16)',
  yellow_background: 'rgba(255, 221, 87, 0.16)',
  green_background: 'rgba(123, 255, 90, 0.16)',
  blue_background: 'rgba(90, 200, 255, 0.16)',
  purple_background: 'rgba(199, 146, 255, 0.16)',
  pink_background: 'rgba(255, 142, 207, 0.16)',
  red_background: 'rgba(255, 109, 109, 0.16)',
}

function RichTextSpan({ segment }) {
  const { plain_text: text, annotations, href } = segment
  let node = text
  if (annotations.code) node = <code>{node}</code>
  if (annotations.bold) node = <strong>{node}</strong>
  if (annotations.italic) node = <em>{node}</em>
  if (annotations.strikethrough) node = <s>{node}</s>
  if (annotations.underline) node = <u>{node}</u>

  if (annotations.color && annotations.color !== 'default') {
    const isBackground = annotations.color.endsWith('_background')
    const style = isBackground
      ? { backgroundColor: NOTION_COLORS[annotations.color] }
      : { color: NOTION_COLORS[annotations.color] }
    node = <span style={style}>{node}</span>
  }

  if (href) {
    node = (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {node}
      </a>
    )
  }
  return node
}

function RichText({ richText }) {
  if (!richText || richText.length === 0) return null
  return richText.map((segment, i) => <RichTextSpan key={i} segment={segment} />)
}

// Notion returns list items as flat, individually-typed blocks — this groups
// consecutive bulleted/numbered items into one <ul>/<ol> the way they'd
// actually render in Notion.
function groupConsecutiveLists(blocks) {
  const groups = []
  for (const block of blocks) {
    const last = groups[groups.length - 1]
    if (block.type === 'bulleted_list_item' && last?.type === 'bulleted_list') {
      last.blocks.push(block)
    } else if (block.type === 'bulleted_list_item') {
      groups.push({ type: 'bulleted_list', blocks: [block] })
    } else if (block.type === 'numbered_list_item' && last?.type === 'numbered_list') {
      last.blocks.push(block)
    } else if (block.type === 'numbered_list_item') {
      groups.push({ type: 'numbered_list', blocks: [block] })
    } else {
      groups.push({ type: 'single', block })
    }
  }
  return groups
}

function NotionListItem({ block }) {
  const value = block[block.type]
  return (
    <li>
      <RichText richText={value.rich_text} />
      {block.children && <NotionBlockList blocks={block.children} />}
    </li>
  )
}

export function NotionBlockList({ blocks }) {
  if (!blocks || blocks.length === 0) return null
  const groups = groupConsecutiveLists(blocks)
  return groups.map((group, i) => {
    if (group.type === 'bulleted_list') {
      return (
        <ul key={i} className="notion-list">
          {group.blocks.map((block) => (
            <NotionListItem key={block.id} block={block} />
          ))}
        </ul>
      )
    }
    if (group.type === 'numbered_list') {
      return (
        <ol key={i} className="notion-list">
          {group.blocks.map((block) => (
            <NotionListItem key={block.id} block={block} />
          ))}
        </ol>
      )
    }
    return <NotionBlock key={group.block.id} block={group.block} />
  })
}

function NotionBlock({ block }) {
  const value = block[block.type]

  switch (block.type) {
    case 'paragraph':
      return (
        <p>
          <RichText richText={value.rich_text} />
        </p>
      )
    case 'heading_1':
      return (
        <h1>
          <RichText richText={value.rich_text} />
        </h1>
      )
    case 'heading_2':
      return (
        <h2>
          <RichText richText={value.rich_text} />
        </h2>
      )
    case 'heading_3':
      return (
        <h3>
          <RichText richText={value.rich_text} />
        </h3>
      )
    case 'to_do':
      return (
        <div className={`notion-todo${value.checked ? ' notion-todo-checked' : ''}`}>
          <input type="checkbox" checked={value.checked} readOnly disabled />
          <span>
            <RichText richText={value.rich_text} />
          </span>
          {block.children && <NotionBlockList blocks={block.children} />}
        </div>
      )
    case 'quote':
      return (
        <blockquote className="notion-quote">
          <RichText richText={value.rich_text} />
          {block.children && <NotionBlockList blocks={block.children} />}
        </blockquote>
      )
    case 'callout':
      return (
        <div className="notion-callout">
          {value.icon?.emoji && <span className="notion-callout-icon">{value.icon.emoji}</span>}
          <div className="notion-callout-body">
            <RichText richText={value.rich_text} />
            {block.children && <NotionBlockList blocks={block.children} />}
          </div>
        </div>
      )
    case 'divider':
      return <hr className="notion-divider" />
    case 'image': {
      const src = value.type === 'external' ? value.external.url : value.file.url
      const hasCaption = value.caption?.length > 0
      return (
        <figure className="notion-image">
          <a href={src} target="_blank" rel="noopener noreferrer">
            <img src={src} alt="" loading="lazy" />
          </a>
          {hasCaption && (
            <figcaption>
              <RichText richText={value.caption} />
            </figcaption>
          )}
        </figure>
      )
    }
    case 'code':
      return (
        <div className="notion-code-block">
          {value.language && <div className="notion-code-lang">{value.language}</div>}
          <pre>
            <code>{(value.rich_text || []).map((t) => t.plain_text).join('')}</code>
          </pre>
        </div>
      )
    case 'toggle':
      return (
        <details className="notion-toggle">
          <summary>
            <RichText richText={value.rich_text} />
          </summary>
          {block.children && <NotionBlockList blocks={block.children} />}
        </details>
      )
    case 'table': {
      const rows = block.children || []
      return (
        <table className="notion-table">
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {row.table_row.cells.map((cell, i) => (
                  <td key={i}>
                    <RichText richText={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    case 'column_list':
    case 'column':
    case 'synced_block':
      return block.children ? <NotionBlockList blocks={block.children} /> : null
    case 'bookmark':
    case 'embed':
    case 'link_preview':
      return (
        <a className="notion-link-card" href={value.url} target="_blank" rel="noopener noreferrer">
          {value.url}
        </a>
      )
    case 'video':
    case 'audio':
    case 'pdf':
    case 'file': {
      const src = value.type === 'external' ? value.external.url : value.file?.url
      return (
        <a className="notion-link-card" href={src} target="_blank" rel="noopener noreferrer">
          Open {block.type} in Notion →
        </a>
      )
    }
    case 'child_page':
      return <p className="notion-fallback">Page: {value.title} — open in Notion to view.</p>
    case 'child_database':
      return <p className="notion-fallback">Linked database — open in Notion to view.</p>
    case 'equation':
      return <p className="notion-fallback">Equation: {value.expression}</p>
    default:
      return (
        <p className="notion-fallback">
          Unsupported content (<em>{block.type}</em>) — open in Notion to view.
        </p>
      )
  }
}
