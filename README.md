# S1
Current website of the Service One website

Service one allows service organizations to track members, hours, and events.  Members can ask questions and post to a common board.  Organization leaders can request fees and manage their members. It also allows users to discover other organizations and events.

Classes of Users
Stranger - a visitor that is not signed in
  This user can view public organization pages but not join or interact with those organizations
user - a user that is not part of a specific organization
  This user can view organization pages and can join organizations
  This user can also view their home page and look up nearby service events
member - a user that is a part of a specific organization
  This user can look up members, pay fees, RSVP for events, and post on their organization wall.
Admin - a user that manages a specific organization
  This user can manager member hours, create events and edit the organization wall.

Page Outline: https://docs.google.com/document/d/1Hd8Qcd1SH_cDyI6wvaBXESlddOim06APdcCzCWFl-O4/edit?usp=sharing
  
index
  This is the splash page for the site.
Home page
  This is the home page for users.  It shows organizations they are a part of as well as nearby events.  They can edit information about themselves here too.
Organization page
  This is the page for a specific organization, it includes the club image and summary.  Strangers are able to view public events.  Members can view other members, pay fees, view and RSVP for events and post on the organization wall.  Admins can edit members, create events and edit the organization wall.

https://github.com/Semantic-Org/Semantic-UI/pull/3256


to-do:
  can remove client javascript that handles lack of a trailing slash, problem has been fixed
  secure mongo database
  add config file for things such as facebook app id and google app id

  I might change javascript files so strangers get a different javascript file than an admin

  update nearby events after change
  change image size for load speed
  
  search bar
  approved member join
