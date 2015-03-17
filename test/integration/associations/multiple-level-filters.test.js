'use strict';

var chai = require('chai')
  , expect = chai.expect
  , Support = require(__dirname + '/../support')
  , DataTypes = require(__dirname + '/../../../lib/data-types');

chai.config.includeStack = true;

describe(Support.getTestDialectTeaser('Multiple Level Filters'), function() {
  it('can filter through belongsTo', function() {
    var User = this.sequelize.define('User', {username: DataTypes.STRING })
      , Task = this.sequelize.define('Task', {title: DataTypes.STRING })
      , Project = this.sequelize.define('Project', { title: DataTypes.STRING });

    Project.belongsTo(User);
    User.hasMany(Project);

    Task.belongsTo(Project);
    Project.hasMany(Task);

    return this.sequelize.sync({ force: true }).then(function() {
      return User.bulkCreate([{
        username: 'leia'
      }, {
        username: 'vader'
      }]).then(function() {
        return Project.bulkCreate([{
          UserId: 1,
          title: 'republic'
        },{
          UserId: 2,
          title: 'empire'
        }]).then(function() {
          return Task.bulkCreate([{
            ProjectId: 1,
            title: 'fight empire'
          },{
            ProjectId: 1,
            title: 'stablish republic'
          },{
            ProjectId: 2,
            title: 'destroy rebel alliance'
          },{
            ProjectId: 2,
            title: 'rule everything'
          }]).then(function() {
            return Task.findAll({
              include: [
                {model: Project, include: [
                  {model: User, where: {username: 'leia'}}
                ]}
              ]
            }).then(function(tasks) {
              expect(tasks.length).to.be.equal(2);
              expect(tasks[0].title).to.be.equal('fight empire');
              expect(tasks[1].title).to.be.equal('stablish republic');
            });
          });
        });
      });
    });
  });

  it('avoids duplicated tables in query', function() {
    var User = this.sequelize.define('User', {username: DataTypes.STRING })
      , Task = this.sequelize.define('Task', {title: DataTypes.STRING })
      , Project = this.sequelize.define('Project', { title: DataTypes.STRING });

    Project.belongsTo(User);
    User.hasMany(Project);

    Task.belongsTo(Project);
    Project.hasMany(Task);

    return this.sequelize.sync({ force: true }).then(function() {
      return User.bulkCreate([{
        username: 'leia'
      }, {
        username: 'vader'
      }]).then(function() {
        return Project.bulkCreate([{
          UserId: 1,
          title: 'republic'
        },{
          UserId: 2,
          title: 'empire'
        }]).then(function() {
          return Task.bulkCreate([{
            ProjectId: 1,
            title: 'fight empire'
          },{
            ProjectId: 1,
            title: 'stablish republic'
          },{
            ProjectId: 2,
            title: 'destroy rebel alliance'
          },{
            ProjectId: 2,
            title: 'rule everything'
          }]).then(function() {
            return Task.findAll({
              include: [
                {model: Project, include: [
                  {model: User, where: {
                    username: 'leia',
                    id: 1
                  }}
                ]}
              ]
            }).then(function(tasks) {
              expect(tasks.length).to.be.equal(2);
              expect(tasks[0].title).to.be.equal('fight empire');
              expect(tasks[1].title).to.be.equal('stablish republic');
            });
          });
        });
      });
    });
  });

  it('can filter through hasMany', function() {
    var User = this.sequelize.define('User', {username: DataTypes.STRING })
      , Task = this.sequelize.define('Task', {title: DataTypes.STRING })
      , Project = this.sequelize.define('Project', { title: DataTypes.STRING });

    Project.belongsTo(User);
    User.hasMany(Project);

    Task.belongsTo(Project);
    Project.hasMany(Task);

    return this.sequelize.sync({ force: true }).then(function() {
      return User.bulkCreate([{
        username: 'leia'
      }, {
        username: 'vader'
      }]).then(function() {
        return Project.bulkCreate([{
          UserId: 1,
          title: 'republic'
        },{
          UserId: 2,
          title: 'empire'
        }]).then(function() {
          return Task.bulkCreate([{
            ProjectId: 1,
            title: 'fight empire'
          },{
            ProjectId: 1,
            title: 'stablish republic'
          },{
            ProjectId: 2,
            title: 'destroy rebel alliance'
          },{
            ProjectId: 2,
            title: 'rule everything'
          }]).then(function() {
            return User.findAll({
              include: [
                {model: Project, include: [
                  {model: Task, where: {title: 'fight empire'}}
                ]}
              ]
            }).then(function(users) {
              expect(users.length).to.be.equal(1);
              expect(users[0].username).to.be.equal('leia');
            });
          });
        });
      });
    });
  });

  it('can filter through hasMany connector', function() {
    var User = this.sequelize.define('User', {username: DataTypes.STRING })
      , Project = this.sequelize.define('Project', { title: DataTypes.STRING });

    Project.hasMany(User);
    User.hasMany(Project);

    return this.sequelize.sync({ force: true }).then(function() {
      return User.bulkCreate([{
        username: 'leia'
      }, {
        username: 'vader'
      }]).then(function() {
        return Project.bulkCreate([{
          title: 'republic'
        },{
          title: 'empire'
        }]).then(function() {
          return User.find(1).then(function(user) {
            return Project.find(1).then(function(project) {
              return user.setProjects([project]).then(function() {
                return User.find(2).then(function(user) {
                  return Project.find(2).then(function(project) {
                    return user.setProjects([project]).then(function() {
                      return User.findAll({
                        include: [
                          {model: Project, where: {title: 'republic'}}
                        ]
                      }).then(function(users) {
                        expect(users.length).to.be.equal(1);
                        expect(users[0].username).to.be.equal('leia');
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });


  it('with offset and limit can filter through hasMany connector', function() {
    var self = this;
    var User = this.sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING
      }
    });

    var Project = this.sequelize.define('Project', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING
      },
      active: {
        type: DataTypes.BOOLEAN
      }
    });

    var UsersProjects = this.sequelize.define('UsersProjects', {

    });

    User.belongsToMany(Project, {through: UsersProjects});
    Project.belongsToMany(User, {through: UsersProjects});

    return this.sequelize.sync({ force: true }).then(function() {
      return self.sequelize.Promise.all([
        User.create({ username: 'User 1'}),
        User.create({ username: 'User 2'}),
        User.create({ username: 'User 3'}),
        User.create({ username: 'User 4'}),
        User.create({ username: 'User 5'}),
        User.create({ username: 'User 6'}),
        User.create({ username: 'User 7'}),
        Project.create({ title: 'Project 1', active: true}), // user1
        Project.create({ title: 'Project 2', active: false}), // user1
        Project.create({ title: 'Project 3', active: true}), // user1
        Project.create({ title: 'Project 4', active: true}),// user3
        Project.create({ title: 'Project 5', active: false}),//user2
        Project.create({ title: 'Project 6', active: true}),// user4
        Project.create({ title: 'Project 7', active: true}),// user5
        Project.create({ title: 'Project 8', active: false}),//user2
        Project.create({ title: 'Project 9', active: true}),//user6
        Project.create({ title: 'Project 10', active: false}),//user7
      ]);
    }).spread(function(user1, user2, user3, user4, user5, user6, user7,
                       project1, project2, project3, project4, project5, project6, project7, project8, project9, project10) {

      return self.sequelize.Promise.all([
        user1.setProjects([project1, project2, project3]), // has active projects
        user2.setProjects([project5, project8]),
        user3.setProjects([project4]),// has active projects
        user4.setProjects([project6]),// has active projects
        user5.setProjects([project7]),// has active projects
        user6.setProjects([project9]),// has active projects
        user7.setProjects([project10]),
      ]);
    }).then(function() {
      return User.findAll({ offset: 0, limit: 2 , include: [ { model: Project, where: { active: true } }] , order: [['id', 'ASC']] });
    }).then(function(users) {
      expect(users.length).to.be.equal(2);
    });

  }); //with offset and limit can filter through hasMany connector

});
