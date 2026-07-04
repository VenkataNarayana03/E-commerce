function Register() {
  return (
    <form className="mx-auto bg-white border rounded p-4" style={{ maxWidth: 460 }}>
      <h1 className="h4 mb-3">Register</h1>
      <label className="form-label" htmlFor="name">Name</label>
      <input className="form-control mb-3" id="name" required />
      <label className="form-label" htmlFor="email">Email</label>
      <input className="form-control mb-3" id="email" type="email" required />
      <label className="form-label" htmlFor="password">Password</label>
      <input className="form-control mb-3" id="password" type="password" required />
      <button className="btn btn-primary w-100" type="submit">Create Account</button>
    </form>
  );
}

export default Register;

