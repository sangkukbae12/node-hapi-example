const Hapi = require("@hapi/hapi");
const Bcrypt = require("bcrypt");

const users = [
  {
    username: "john",
    password: "$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm",
    name: "John Doe",
    id: "2133d32a"
  }
];

// const validate = async (request, username, password) => {
//   console.log("username: ", username);
//   console.log("password: ", password);
//   const user = users[username];
//   if (!user) {
//     return { credentials: null, isValid: false };
//   }

//   const isValid = await Bcrypt.compare(password, user.password);
//   console.log("isValid: ", isValid);
//   const credentials = { id: user.id, name: user.name };
//   console.log("credential: ", credentials);

//   return { isValid, credentials };
// };

const start = async () => {
  const server = Hapi.server({
    port: 4000,
    host: "localhost"
  });

  // await server.register(require("@hapi/basic"));
  await server.register(require("@hapi/cookie"));

  // server.auth.strategy("simple", "basic", { validate });
  server.auth.strategy("session", "cookie", {
    cookie: {
      name: "sid-example",
      password: "!wsYhFA*C2U6nz=Bu^%A@^F#SF3&kSR6",
      isSecure: false
    },
    redirectTo: "/login",
    validateFunc: async (request, session) => {
      const account = await users.find(user => user.id === session.id);

      if (!account) {
        return { valid: false };
      }

      return { valid: true, credentials: account };
    }
  });

  server.auth.default("session");

  server.route([
    {
      method: "GET",
      path: "/",
      // options: {
      //   auth: "simple"
      // },
      handler: (request, h) => {
        return "welcome to the restricted home page!";
      }
    },
    {
      method: "GET",
      path: "/login",
      handler: (request, h) => {
        return ` <html>
                      <head>
                          <title>Login page</title>
                      </head>
                      <body>
                          <h3>Please Log In</h3>
                          <form method="post" action="/login">
                              Username: <input type="text" name="username"><br>
                              Password: <input type="password" name="password"><br/>
                          <input type="submit" value="Login"></form>
                      </body>
                  </html>`;
      },
      options: {
        auth: false
      }
    },
    {
      method: "POST",
      path: "/login",
      handler: async (request, h) => {
        const { username, password } = request.payload;
        const account = users.find(user => user.username === username);

        if (!account || !(await Bcrypt.compare(password, account.password))) {
          return h.view("/login");
        }

        request.cookieAuth.set({ id: account.id });

        return h.redirect("/");
      },
      options: {
        auth: {
          mode: "try"
        }
      }
    }
  ]);

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", err => {
  console.log(err);
  process.exit(1);
});

start();
