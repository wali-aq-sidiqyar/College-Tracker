export function createFolder(name) {
  return { id: crypto.randomUUID(), name, children: [] }
}

// parentId of null adds to the root list.
export function addChild(nodes, parentId, folder) {
  if (parentId === null) return [...nodes, folder]
  return nodes.map((node) =>
    node.id === parentId
      ? { ...node, children: [...node.children, folder] }
      : { ...node, children: addChild(node.children, parentId, folder) }
  )
}

export function renameNode(nodes, id, name) {
  return nodes.map((node) =>
    node.id === id ? { ...node, name } : { ...node, children: renameNode(node.children, id, name) }
  )
}

// Removing a node drops its children array with it, so descendants cascade automatically.
export function removeNode(nodes, id) {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({ ...node, children: removeNode(node.children, id) }))
}

export function countDescendants(node) {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0)
}
