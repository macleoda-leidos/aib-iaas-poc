function Error() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>An error occurred</h1>
      <p>Sorry, something went wrong.</p>
      <a href="/">Return to home</a>
    </div>
  );
}

Error.getInitialProps = () => {
  return { statusCode: 500 };
};

export default Error;
