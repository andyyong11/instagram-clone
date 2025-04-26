export const appStyles = {
  // Profile Page Styles
  profile: {
    loadingContainer: { 
      display: "flex", 
      justifyContent: "center", 
      my: 8 
    },
    errorPaper: { 
      p: 4, 
      mt: 4, 
      textAlign: "center" 
    },
    postsGrid: { 
      mt: 4, 
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: 3
    },
    postItem: {
      position: "relative",
      borderRadius: 2,
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      height: 280,
      cursor: "pointer",
      transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }
    },
    errorImageContainer: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "grey.100",
      p: 2,
      textAlign: "center"
    },
    errorIcon: { 
      mb: 2 
    },
    imageContainer: { 
      height: "75%", 
      overflow: "hidden" 
    },
    postImageStyle: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    postDetails: { 
      p: 1.5,
      height: "25%",
      bgcolor: "background.paper",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    },
    postCaption: { 
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      lineHeight: 1.2
    },
    postStats: { 
      display: "flex", 
      alignItems: "center", 
      mt: 0.5, 
      justifyContent: "space-between" 
    },
    likesContainer: { 
      display: "flex", 
      alignItems: "center" 
    },
    likeIcon: { 
      color: "error.light", 
      fontSize: 16, 
      mr: 0.5 
    },
    loadingMoreContainer: {
      display: "flex", 
      justifyContent: "center", 
      my: 4
    },
    emptyContainer: {
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      flexDirection: "column",
      my: 8
    }
  }
  // Add sections for other components here as needed
}; 