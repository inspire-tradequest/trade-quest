
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User, Heart, Reply, Flag, ThumbsUp, Filter, Plus } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';

interface ForumPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  username: string;
  avatar_url: string | null;
  likes_count: number;
  comments_count: number;
  is_liked_by_user: boolean;
  tags: string[];
}

interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
  likes_count: number;
  is_liked_by_user: boolean;
}

export default function DiscussionForum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [currentTag, setCurrentTag] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    fetchPosts();
    
    // Set up real-time subscription for new posts
    const postsChannel = supabase
      .channel('forum-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'forum_posts'
      }, () => {
        fetchPosts();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [currentTag]);
  
  const fetchPosts = async () => {
    if (!user) return;
    
    setIsLoadingPosts(true);
    try {
      let query = supabase.functions.invoke('get-forum-posts', {
        body: {
          userId: user.id,
          tag: currentTag
        }
      });
      
      const { data, error } = await query;
      if (error) throw error;
      
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };
  
  const fetchComments = async (postId: string) => {
    if (!user) return;
    
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-forum-comments', {
        body: {
          userId: user.id,
          postId
        }
      });
      
      if (error) throw error;
      
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  const handleCreatePost = async () => {
    if (!user || !newPostTitle.trim() || !newPostContent.trim()) return;
    
    try {
      const tags = newPostTags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          user_id: user.id,
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
          tags
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Reset form
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostTags('');
      setDialogOpen(false);
      
      // Add new post to list
      fetchPosts();
      
      toast({
        title: 'Post created',
        description: 'Your post has been published successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Error creating post',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const handleCreateComment = async () => {
    if (!user || !selectedPost || !newCommentContent.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('forum_comments')
        .insert({
          user_id: user.id,
          post_id: selectedPost.id,
          content: newCommentContent.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Reset comment input
      setNewCommentContent('');
      
      // Refresh comments
      fetchComments(selectedPost.id);
      
      // Update comments count in posts list
      setPosts(posts.map(post => 
        post.id === selectedPost.id 
          ? { ...post, comments_count: (post.comments_count || 0) + 1 } 
          : post
      ));
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted.'
      });
    } catch (error: any) {
      toast({
        title: 'Error adding comment',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const handleLikePost = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    
    try {
      if (isLiked) {
        // Unlike post
        await supabase
          .from('forum_post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
      } else {
        // Like post
        await supabase
          .from('forum_post_likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });
      }
      
      // Update like status locally
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
            is_liked_by_user: !isLiked
          };
        }
        return post;
      }));
      
      // If this is the selected post, update it too
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => {
          if (!prev) return null;
          return {
            ...prev,
            likes_count: isLiked ? prev.likes_count - 1 : prev.likes_count + 1,
            is_liked_by_user: !isLiked
          };
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };
  
  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user) return;
    
    try {
      if (isLiked) {
        // Unlike comment
        await supabase
          .from('forum_comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
      } else {
        // Like comment
        await supabase
          .from('forum_comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId
          });
      }
      
      // Update like status locally
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes_count: isLiked ? comment.likes_count - 1 : comment.likes_count + 1,
            is_liked_by_user: !isLiked
          };
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error updating comment like:', error);
    }
  };
  
  const handleViewPost = (post: ForumPost) => {
    setSelectedPost(post);
    fetchComments(post.id);
  };
  
  const handleBackToList = () => {
    setSelectedPost(null);
    setComments([]);
  };
  
  const filterByTag = (tag: string | null) => {
    setCurrentTag(tag);
  };
  
  // Extract all unique tags from posts
  const allTags = Array.from(new Set(posts.flatMap(post => post.tags || [])));
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Trading Discussion
              </CardTitle>
              <CardDescription>
                Share insights and discuss trading strategies with the community
              </CardDescription>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Post</DialogTitle>
                  <DialogDescription>
                    Share your thoughts, questions, or insights with the community.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">Title</label>
                    <Input
                      id="title"
                      placeholder="Enter a descriptive title"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="content" className="text-sm font-medium">Content</label>
                    <Textarea
                      id="content"
                      placeholder="Write your post content here..."
                      rows={5}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="tags" className="text-sm font-medium">Tags</label>
                    <Input
                      id="tags"
                      placeholder="e.g. strategy, technical, beginner (comma separated)"
                      value={newPostTags}
                      onChange={(e) => setNewPostTags(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Add relevant tags to help others find your post
                    </p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    onClick={handleCreatePost} 
                    disabled={!newPostTitle.trim() || !newPostContent.trim()}
                  >
                    Publish Post
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {!selectedPost ? (
            // Posts List View
            <>
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                <Button
                  variant={currentTag === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => filterByTag(null)}
                >
                  All
                </Button>
                
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    variant={currentTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => filterByTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              
              {isLoadingPosts ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border rounded-md p-4 space-y-3">
                      <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                      <div className="h-20 bg-muted rounded animate-pulse w-full" />
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No posts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to start a discussion in the community!
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <Card key={post.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleViewPost(post)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.avatar_url || undefined} alt={post.username} />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{post.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{post.username}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex gap-1">
                                {post.tags.map(tag => (
                                  <span key={tag} className="text-xs px-2 py-1 bg-muted rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <button 
                              className="flex items-center gap-1 text-sm text-muted-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikePost(post.id, post.is_liked_by_user);
                              }}
                            >
                              <Heart className={`h-4 w-4 ${post.is_liked_by_user ? 'fill-red-500 text-red-500' : ''}`} />
                              <span>{post.likes_count}</span>
                            </button>
                            
                            <button className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MessageSquare className="h-4 w-4" />
                              <span>{post.comments_count}</span>
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Single Post Detail View
            <div>
              <Button variant="ghost" size="sm" onClick={handleBackToList} className="mb-4">
                ← Back to discussions
              </Button>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedPost.avatar_url || undefined} alt={selectedPost.username} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-1">{selectedPost.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <span className="font-medium text-foreground">{selectedPost.username}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true })}</span>
                      </div>
                      
                      <div className="prose max-w-none mb-4">
                        <p>{selectedPost.content}</p>
                      </div>
                      
                      {selectedPost.tags && selectedPost.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedPost.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 bg-muted rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-6">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`flex items-center gap-1 ${selectedPost.is_liked_by_user ? 'text-red-500' : ''}`}
                          onClick={() => handleLikePost(selectedPost.id, selectedPost.is_liked_by_user)}
                        >
                          <Heart className={`h-4 w-4 ${selectedPost.is_liked_by_user ? 'fill-red-500' : ''}`} />
                          <span>Like{selectedPost.likes_count > 0 ? ` (${selectedPost.likes_count})` : ''}</span>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Reply className="h-4 w-4" />
                          <span>Reply</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="font-medium text-lg mb-4">
                      Comments ({comments.length})
                    </h3>
                    
                    <div className="mb-6">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newCommentContent}
                        onChange={(e) => setNewCommentContent(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          onClick={handleCreateComment}
                          disabled={!newCommentContent.trim()}
                          size="sm"
                        >
                          Post Comment
                        </Button>
                      </div>
                    </div>
                    
                    {isLoadingComments ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                              <div className="h-12 bg-muted rounded animate-pulse w-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No comments yet. Be the first to comment!
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {comments.map(comment => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={comment.avatar_url || undefined} alt={comment.username} />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{comment.username}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              
                              <p className="text-sm mb-2">{comment.content}</p>
                              
                              <div className="flex items-center gap-4">
                                <button 
                                  className={`flex items-center gap-1 text-xs ${comment.is_liked_by_user ? 'text-red-500' : 'text-muted-foreground'}`}
                                  onClick={() => handleLikeComment(comment.id, comment.is_liked_by_user)}
                                >
                                  <ThumbsUp className={`h-3 w-3 ${comment.is_liked_by_user ? 'fill-red-500' : ''}`} />
                                  <span>{comment.likes_count > 0 ? comment.likes_count : ''} Like</span>
                                </button>
                                
                                <button className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Reply className="h-3 w-3" />
                                  <span>Reply</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
