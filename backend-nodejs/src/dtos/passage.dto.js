class CreatePassageDto {
  constructor({ title, content }) {
    this.title = typeof title === "string" ? title.trim() : title;
    this.content = typeof content === "string" ? content.trim() : content;
  }

  validate() {
    const errors = [];

    if (!this.title) {
      errors.push("title is required");
    }

    if (!this.content) {
      errors.push("content is required");
    }

    return errors;
  }
}

module.exports = { CreatePassageDto };
