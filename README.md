# Former

Former the best AI SQL Editor.


(gifs)



## Getting Started

### Former Cloud

The fastest way to get started with Former is by visting [Former Labs](https://formerlabs.com/products) to download the desktop client. This package will use a cloud hosted instance of Former for account and workspace management, but all database connections and query results will remain local and secure.

Former Cloud offers a generous free tier with a 14 day trial period. After the trial period ends, you are welcome to start paying for Former Pro or switch to the self hosted option.


### Self-hosting

You can self-host and build your own instance of Former for free. Former is packaged as an Electron app with a NextJS server and can be compiled for Windows and MacOS.

You can build the app for your local machine with:
```bash
npm run electron:make
```

To host the server, follow typical instructions for a NextJS deployment (we recommend [Vercel](https://vercel.com/) free tier). You will also need to modify the server domain pointed to by the [Electron app](https://github.com/former-labs/former/blob/dev/src/electron/env.electron.js) and spin up a PostgreSQL database (we recommend [Supabase](https://supabase.com/) free tier).


To make changes to your local instance or self hosted server, see the [Contributing](#contributing) section.


## Contributing

You can contribute to Former by:

- Submit a [feature request](https://github.com/former-labs/former/issues) or [bug report](https://github.com/former-labs/former/issues)
- Opening a [Pull Request](https://github.com/former-labs/former/pulls)

Bug reports and feature requests are especially welcome and all will be considered! If there is some blocker preventing your from using Former (e.g. unsupported database), feel free to open an issue and we will do our best to add support.

To make changes, run the server locally with:

```bash
npm run dev
```

The Electron app can be self hosted with:

```bash
npm run electron:dev
```
