import Post from "../models/Post.js";
import Connection from "../models/Connection.js";
import Notification from "../models/Notification.js";

export const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user?.id || req.userId;

    // Get user's connections
    const connections = await Connection.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: "accepted"
    });

    const connectedUserIds = connections.map(conn => 
      conn.requester.toString() === userId ? conn.recipient : conn.requester
    );

    // Include own posts + connected users' posts
    const authorIds = [userId, ...connectedUserIds];

    const posts = await Post.find({ 
      author: { $in: authorIds },
      visibility: { $in: ["public", "connections"] }
    })
      .populate("author", "name email profilePic headline")
      .populate("comments.user", "name profilePic")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Post.countDocuments({ 
      author: { $in: authorIds },
      visibility: { $in: ["public", "connections"] }
    });

    res.json({
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, media, tags, visibility } = req.body;
    const userId = req.user?.id || req.userId;

    const post = await Post.create({
      content,
      media: media || [],
      tags,
      visibility: visibility || "public",
      author: userId
    });

    const populatedPost = await Post.findById(post._id)
      .populate("author", "name email profilePic headline");

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Like/Unlike post
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user?.id || req.userId;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
      if (post.author.toString() !== userId) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: "post_like",
          content: "liked your post",
          link: `/posts/${post._id}`,
          metadata: { postId: post._id }
        });
      }
    }

    await post.save();
    res.json({ likes: post.likes.length, isLiked: likeIndex === -1 });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Add comment
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user?.id || req.userId;
    post.comments.push({ user: userId, text });
    await post.save();

    if (post.author.toString() !== userId) {
      await Notification.create({
        recipient: post.author,
        sender: userId,
        type: "post_comment",
        content: "commented on your post",
        link: `/posts/${post._id}`,
        metadata: { postId: post._id }
      });
    }

    const populatedPost = await Post.findById(post._id).populate("comments.user", "name profilePic");
    res.json(populatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete post
export const incrementShare = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ shares: post.shares });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== userId) return res.status(403).json({ message: "Not authorized" });

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { content, media, tags, visibility } = req.body;
    const userId = req.user?.id || req.userId;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== userId) return res.status(403).json({ message: "Not authorized" });

    post.content = content || post.content;
    post.media = media || post.media;
    post.tags = tags || post.tags;
    post.visibility = visibility || post.visibility;
    post.isEdited = true;
    post.editedAt = Date.now();

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("author", "name email profilePic headline");

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate("author", "name email profilePic headline")
      .populate("comments.user", "name profilePic")
      .sort("-createdAt")
      .lean();

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
