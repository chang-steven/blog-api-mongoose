const mongoose = require('mongoose');

const blogPostSchema =  mongoose.Schema({
      title: {type: String, required: true},
      content: {type: String, required: true},
      author: {
        firstName: {type: String, required: true},
        lastName: {type: String, required: true}
      }
  });

blogPostSchema.virtual('authorString').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`
});

blogPostSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    authorName: `${this.author.firstName} ${this.author.lastName}`
  }
}


const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = {BlogPost};
