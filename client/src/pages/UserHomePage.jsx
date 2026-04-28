import { Link } from "react-router-dom";

const productDetails = [
  { codeFrom: "SC(B/M)000001", codeTo: "SC(B/M)000004", category: "Science" },
  { codeFrom: "EC(B/M)000001", codeTo: "EC(B/M)000004", category: "Economics" },
  { codeFrom: "FC(B/M)000001", codeTo: "FC(B/M)000004", category: "Fiction" },
  { codeFrom: "CH(B/M)000001", codeTo: "CH(B/M)000004", category: "Children" },
  {
    codeFrom: "PD(B/M)000001",
    codeTo: "PD(B/M)000004",
    category: "Personal Development"
  }
];

const UserHomePage = () => (
  <section className="page-card">
    <p className="eyebrow">Home Page</p>
    <h2>Home Page</h2>

    <div className="action-row">
      <Link className="btn secondary" to="/reports">
        Reports
      </Link>
      <Link className="btn secondary" to="/transactions">
        Transactions
      </Link>
    </div>

    <div className="table-wrap spaced-top">
      <h3>Product Details</h3>
      <table>
        <thead>
          <tr>
            <th>Code No From</th>
            <th>Code No To</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {productDetails.map((detail) => (
            <tr key={detail.codeFrom}>
              <td>{detail.codeFrom}</td>
              <td>{detail.codeTo}</td>
              <td>{detail.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default UserHomePage;
