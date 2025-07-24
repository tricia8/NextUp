import { LegendList } from "@legendapp/list";
import { StyleSheet, Dimensions, StatusBar, View } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { PostWithPending } from "@/types/postWithPending";
import { useState } from "react";
import DeleteModal from "./DeleteModal";
import { showMessage } from "react-native-flash-message";
import { deletePost } from "@/firebase/firestore";
import PostItem from "./PostItem";

type PostListProps = {
  userId: string;
  sublistId: string;
  goalId: string;
  ownerId: string;
  posts: PostWithPending[];
  isDark?: boolean;
};

export default function PostList({
  userId,
  sublistId,
  goalId,
  ownerId,
  posts,
  isDark = false,
}: PostListProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PostWithPending | null>(
    null
  );
  const heading = "Are you sure you want to delete this post?";
  const body = "This action cannot be undone.";

  const isPostWithPending = (item: any): item is PostWithPending => {
    return (
      item &&
      typeof item === "object" &&
      "images" in item &&
      "isPending" in item
    );
  };

  const handleDeletePost = async (postId: string) => {
    try {
      console.log("deleting post");
      setModalVisible(false); // close modal after deletion

      const res = await deletePost(sublistId, goalId, postId);
      console.log("deletePost response:", res);

      console.log("deleted!");

      /* updateData((prevSublists) =>
            prevSublists.filter((list) => list.id !== sublist.id)
          ); */
      showMessage({
        message: "Success",
        description: res.userMessage || "Post deleted!",
        type: "success",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "success",
        duration: 5000,
      });
    } catch (error) {
      showMessage({
        message: "Error",
        description:
          error instanceof Error ? error.message : "Error deleting post",
        type: "danger",
        statusBarHeight: StatusBar.currentHeight,
        floating: true,
        icon: "danger",
        duration: 5000,
      });
    }
  };

  const onDeletePress = (post: PostWithPending) => {
    setItemToDelete(post);
    setModalVisible(true);
    console.log("Delete post pressed", post.id);
  };

  const renderItem = ({ item }: { item: PostWithPending }) => {
    return (
      <PostItem
        item={item}
        isDark={isDark}
        ownerId={ownerId}
        userId={userId}
        onDeletePress={onDeletePress}
      />
    );
  };

  return (
    <>
      <LegendList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      {modalVisible && (
        <View
          style={{
            zIndex: 1000,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <DeleteModal
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
            item={itemToDelete}
            handleItemDelete={(item) => {
              // type check to ensure item is a Post
              if (isPostWithPending(item)) {
                handleDeletePost(item.id);
              }
            }}
            heading={heading}
            body={body}
          />
        </View>
      )}
    </>
  );
}
