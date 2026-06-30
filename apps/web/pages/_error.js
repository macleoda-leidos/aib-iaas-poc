// Custom error page compatible with React 19
// This overrides the default Next.js _error page which crashes with React 19
function Error({ statusCode }) {
  return null;
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
