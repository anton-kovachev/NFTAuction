import { Nav, Navbar as React_Navbar, Button, Container } from "react-bootstrap";

const Navbar = ({ isConnected, connect }) => {
  return (
    <React_Navbar expand="lg" className="bg-body-tertiary">
      <Container fluid>
        <React_Navbar.Brand href="/">Auction</React_Navbar.Brand>
        <React_Navbar.Toggle aria-controls="basic-navbar-nav" />
        <React_Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/list">List</Nav.Link>
            <Nav.Link href="/bid">Bid</Nav.Link>
          </Nav>
          <Nav>
            {!isConnected ? (
              <Button variant="danger" onClick={(e) => { connect()}}>
                Connect to Metamask
              </Button>
            ) : (
              <label style={{ color: "green" }}>Connected to Metamask</label>
            )}
          </Nav>
        </React_Navbar.Collapse>
      </Container>
    </React_Navbar>
  );
};

export { Navbar };
