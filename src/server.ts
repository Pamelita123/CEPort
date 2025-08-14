import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import authUsersRouter from '@expressRoutes/users/users.route'
import feedsRouter from '@expressRoutes/feeds/feeds.route';
import express from 'express';
import { join } from 'node:path';
import {authMiddleware} from '@expressMiddleware/auth/auth.middleware';

const browserDistFolder = join(import.meta.dirname, '../public');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api', authUsersRouter );
app.use('/api/feeds', authMiddleware, feedsRouter);


app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});


if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}


export const reqHandler = createNodeRequestHandler(app);

