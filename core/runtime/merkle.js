const crypto = require('crypto');

class MerkleTree {
  constructor(leaves) {
    this.leaves = leaves.map(l => this._hash(l));
    this.tree = this._buildTree(this.leaves);
  }

  _hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  _buildTree(nodes) {
    if (nodes.length === 1) return nodes;
    const nextLevel = [];
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1] || left;
      nextLevel.push(this._hash(left + right));
    }
    return [nodes, ...this._buildTree(nextLevel)];
  }

  getRoot() {
    return this.tree[this.tree.length - 1][0];
  }

  getProof(index) {
    const proof = [];
    for (let i = 0; i < this.tree.length - 1; i++) {
      const level = this.tree[i];
      const isRight = index % 2;
      const siblingIndex = isRight ? index - 1 : index + 1;
      if (siblingIndex < level.length) {
        proof.push({
          position: isRight ? 'left' : 'right',
          data: level[siblingIndex]
        });
      }
      index = Math.floor(index / 2);
    }
    return proof;
  }
}

module.exports = MerkleTree;
