import nextConnect from 'next-connect'

import multer from 'multer';
import { NextApiRequest, NextApiResponse } from "next";
import * as fs from "fs";
import {pdf2png} from "../../src/pdf2img-convert";
import * as path from "path";

// Returns a Multer instance that provides several methods for generating
// middleware that process files uploaded in multipart/form-data format.
const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
});


const apiRoute = nextConnect<NextApiRequest, NextApiResponse>({
  // Handle any other HTTP method
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

const uploadMiddleware = upload.array('theFiles');

// Adds the middleware to Next-Connect
apiRoute.use(uploadMiddleware);

// Process a POST request
apiRoute.post(async (req, res) => {
  const data = await pdf2png(fs.readFileSync(
    path.join(
      process.cwd(),
      'public/uploads/' + (req as any).files[0].path)
    )
  );

  const pngsDir = path.join(
      process.cwd(),
      'public/uploads/',
  );
  if (!fs.existsSync(pngsDir)) {
    fs.mkdirSync(pngsDir);
  }

  data.forEach((e, i) => {
    return fs.writeFileSync(
      path.join(
        pngsDir,
         i + '.png'
      ), e);
  })

  res.json({ data: 'success' });
});

export default apiRoute;


export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};
