self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || "Together", {
      body: data.body || "",
      icon: "/icon.png",
      badge: "/icon.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if ("focus" in c) return c.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});
