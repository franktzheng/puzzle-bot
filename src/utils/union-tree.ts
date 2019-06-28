export class UnionTree {
  parent: UnionTree | null = null

  getRoot(): UnionTree {
    return this.parent ? this.parent.getRoot() : this
  }

  connect(tree: UnionTree) {
    tree.getRoot().parent = this
  }

  isConnected(tree: UnionTree) {
    return tree.getRoot() === this.getRoot()
  }
}
