const { dbQuery } = require("../config/database");

module.exports = {
  getPosts: async (req, res, next) => {
    try {
      let resultPosts = await dbQuery(
        `select p.id, p.image, p.caption, p.created_at, p.user_id, u.username, u.profile_picture from posts p 
        join users u on u.id = p.user_id;`
      );
      let resultComments = await dbQuery(
        `select c.id, c.user_id, u.username, u.profile_picture, c.post_id, c.comment, c.created_at from comments c
        join users u on c.user_id = u.id`
      );
      let resultLikes = await dbQuery(
        `select l.id, l.user_id, u.username, l.post_id from likes l
        join users u on l.user_id = u.id;`
      );

      resultPosts.forEach((postVal) => {
        let comments = [];
        resultComments.forEach((commentsVal) => {
          if (postVal.id == commentsVal.post_id) {
            comments.push({
              user_id: commentsVal.user_id,
              username: commentsVal.username,
              profile_picture: commentsVal.profile_picture,
              comment: commentsVal.comment,
              created_at: commentsVal.created_at,
            });
          }
          postVal.comments = comments;
        });
        
        let likes = [];
        resultLikes.forEach((likesVal) => {
          if (postVal.id == likesVal.post_id) {
            likes.push({
              user_id: likesVal.user_id,
            });
          }
          postVal.likes = likes;
        });
      });

      res.status(200).send(resultPosts);
    } catch (error) {
      return next(error);
    }
  },
};
