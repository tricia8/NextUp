export default {
  expo: {
    name: "nextup",
    slug: "nextup",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "frontend",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    extra: {
      eas: {
        projectId: "1dd732c5-4ee5-4b05-b896-900aa109d327",
      },
    },
    /*"ios": {
      "supportsTablet": true
    },*/
    android: {
      package: "com.nextup.nextup",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },
    /*"web": {
      "bundler": "metro",
      "output": "static",
      //"favicon": "./assets/images/favicon.png"
    },*/
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/adaptive-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
