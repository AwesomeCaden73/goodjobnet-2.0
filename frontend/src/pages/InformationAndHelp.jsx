import { Link } from 'react-router-dom';
function InformationAndHelp() {
  return (
    <div className="help-container fade-in">
      <div className="help-card">
        <h1 className="help-title">Information & Help</h1>

        <div className="help-section">
          <h2>About the Job Bank</h2>
          <p>
            Job opportunities provided on this website are primarily <strong>low or minimum wage</strong>. These jobs are tailored for individuals that need <strong>immediate employment</strong>. Higher paying jobs and establishing a stable career typically takes time and is an area where our Employment Center coaches can provide assistance.
          </p>
        </div>

        <div className="help-section">
          <h2>User Options</h2>
          <ul>
            <li><Link to="/map">Job map</Link>: Explore employer locations across Central Florida.</li>
            <li><Link to="/hot-job-search">Jobs</Link>: Search by company or job type. Include a five-digit ZIP code to find nearby opportunities.</li>
            <li>Job seeker entry: This is a form for entering general information for individuals that are seeking employment. This information is then reviewed by the Orlando Employment Center so they can provide assistance.</li>
            <li>Job opportunity entry: This is a form for entering employment opportunities that can be made available through the Orlando Employment Center for others who are seeking employment.</li>
          </ul>
        </div>

        <div className="help-section">
          <h2>Employment Seeker Assistance</h2>
          <p>
            The Employment Center will review all <strong>Employment Seeker entries</strong> and will attempt to reach out and assist as much as possible. We are dedicated to supporting you as you help others find success in their journey to employment.
          </p>
        </div>

        <div className="help-section">
          <h2>Orlando Employment Center Services</h2>
          <p>
            Information regarding services provided at the Orlando Employment Center can be found at our official page:
            <br />
            <a
              href="https://www.churchofjesuschrist.org/life/employment-centers?lang=eng"
              target="_blank"
              rel="noopener noreferrer"
              className="help-link"
            >
              Church of Jesus Christ - Employment Centers
            </a>
          </p>
        </div>

        <div className="help-section contact-section">
          <h2>Contact Us</h2>
          <p>Questions or comments regarding this website can be directed to:</p>
          <ul className="contact-list">
            <li>
              <strong>Email:</strong> <a href="mailto:mgoodell6@gmail.com">mgoodell6@gmail.com</a>
            </li>
            <li>
              <strong>Orlando Employment Center:</strong> <a href="tel:407-826-9375">407-826-9375</a>
            </li>
            <li>
              <strong>Employment support:</strong> <a href="mailto:Orlandoemploymentoffice@gmail.com">Orlandoemploymentoffice@gmail.com</a>
            </li>
          </ul>
        </div>
        <div className="form-footer">
          <p>No one should go through a job search alone. Our employment coaches offer resume assistance, interview preparation, and networking opportunities.</p>
          <p className="footer-quote">“We can accomplish so much more together than we can alone.”</p>
          <p className="footer-author">— President Russell M. Nelson</p>
        </div>
      </div>
    </div>
  );
}

export default InformationAndHelp;
