"use client";

import React from 'react';

const AdMobBanner = () => {
  // Your AdMob IDs provided by you.
  const adUnitId = "ca-app-pub-7133691087466609/3578315523";
  const appId = "ca-app-pub-7133691087466609~1357662080";

  /**
   * IMPORTANT: This is a placeholder component.
   * AdMob ads do not work directly in web projects like Next.js.
   * When you build your APK, you will need to use a JavaScript Bridge
   * from your Android WebView to call the native AdMob SDK.
   *
   * Example of what you would call from here:
   * if (window.Android && typeof window.Android.showBannerAd === 'function') {
   *   window.Android.showBannerAd(adUnitId);
   * }
   */

  return (
    <div className="fixed bottom-16 left-0 w-full h-14 bg-black flex items-center justify-center text-white text-sm z-40 border-t border-gray-700">
      <p>Ad Placeholder (AdMob Unit ID: {adUnitId})</p>
    </div>
  );
};

export default AdMobBanner;
