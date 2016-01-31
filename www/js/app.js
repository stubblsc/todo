// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('todo', ["ionic", "ngCordova"])

.run(function($ionicPlatform) {
  document.addEventListener("deviceready", function(){
    $ionicPlatform.ready(function() {
      if(window.cordova && window.cordova.plugins.Keyboard) {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

        // Don't remove this line unless you know what you are doing. It stops the viewport
        // from snapping when text inputs are focused. Ionic handles this internally for
        // a much nicer keyboard experience.
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if(window.StatusBar) {
        StatusBar.styleDefault();
      }
      if(device.platform === "iOS") {
        window.plugin.notification.local.promptForPermission();
      }
      $scope.$on("$cordovaLocalNotification:added", function(id, state, json) {
        alert("Added a notification");
      });
    });
  });
})

/**
 * The Projects factory handles saving and loading projects
 * from local storage, and also lets us save and load the
 * last active project index.
 */
.factory('Projects', function() {
  return {
    all: function() {
      var projectString = window.localStorage['projects'];
      if(projectString) {
        return angular.fromJson(projectString);
      }
      return [];
    },
    save: function(projects) {
      window.localStorage['projects'] = angular.toJson(projects);
    },
    newProject: function(projectTitle) {
      // Add a new project
      return {
        title: projectTitle,
        tasks: []
      };
    },
    getLastActiveIndex: function() {
      return parseInt(window.localStorage['lastActiveProject']) || 0;
    },
    setLastActiveIndex: function(index) {
      window.localStorage['lastActiveProject'] = index;
    }
  }
})

.controller('TodoCtrl', function($scope, $ionicModal, Projects, $ionicSideMenuDelegate, $timeout, $ionicPopup, $ionicPlatform, $cordovaLocalNotification) {
  // creates a project
  var createProject = function(projectTitle) {
    var newProject = Projects.newProject(projectTitle);
    $scope.projects.push(newProject);
    Projects.save($scope.projects);
    $scope.selectProject(newProject, $scope.projects.length-1);
  }

  // update project
  $scope.updateProject = function(i, project) {
    if (!project) {
      return;
    }
    $scope.projects[i] = project;
    // inefficient, but save all the projects for now
    Projects.save($scope.projects);
  };

  // delete selected project
  $scope.deleteProject = function(i, project) {
    if (!project) {
      return;
    }

    var changeActive = false;
    if(i == Projects.getLastActiveIndex()){
      changeActive = true
    }

    $scope.showProjectConfirm(function() {
      $scope.projects.splice(i,1);
      if(changeActive == true){
        $scope.selectProject($scope.projects[0], 0);
      }
      Projects.save($scope.projects);
    });
  }

  // load or initialize projects
  $scope.projects = Projects.all();

  // Grab the last active, or the first project
  $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];

  // create a new project
  $scope.newProject = function() {
    var projectTitle = prompt('Project name');
    if(projectTitle) {
      createProject(projectTitle);
    }
  };

  // edit a project name
  $scope.editProject = function(index, project) {
    var projectTitle = prompt('Project name', $scope.projects[index].title);
    if(projectTitle) {
      project.title = projectTitle;
      updateProject(index, project);
    }
  };

  // select the given project
  $scope.selectProject = function(project, index) {
    $scope.activeProject = project;
    Projects.setLastActiveIndex(index);
    $ionicSideMenuDelegate.toggleLeft(false);
  };

  // create modal
  $ionicModal.fromTemplateUrl('new-task.html', function(modal) {
    $scope.taskModal = modal;
  }, {
    scope: $scope
  });

  // Edit and load the Modal
  $ionicModal.fromTemplateUrl('edit-task.html', function(modal) {
    $scope.editTaskModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });

  $scope.createTask = function(task) {
    if(!$scope.activeProject || !task) {
      return;
    }
    $scope.activeProject.tasks.push({
      title: task.title,
      reminderMinute: parseInt(task.reminderMinute),
      reminderHour: parseInt(task.reminderHour)
    });
    $scope.taskModal.hide();

    // Inefficient, but save all the projects
    Projects.save($scope.projects);

    var alarmTime = new Date();
    alarmTime.setMinutes(task.reminderMinute);
    alarmTime.setHours(task.reminderHour);
    $cordovaLocalNotification.add({
      id: 1,
      title: task.title,
      message: task.title + " is due",
      at: alarmTime,
      sound: null
    });

    task.title = ""
    task.reminderMinute = ""
    task.reminderHour = ""
  };

  // Called when the form is submitted
  $scope.updateTask = function(i, task) {
    if (!$scope.activeProject || !task) {
      return;
    }
    $scope.activeProject.tasks[i] = task;
    $scope.editTaskModal.hide();

    // Inefficient, but save all the projects
    Projects.save($scope.projects);
  };

  // delete selected task
  $scope.deleteTask = function(i, task) {
    if (!$scope.activeProject || !task ) {
      return;
    }
    $scope.showTaskConfirm(function() {
      $scope.activeProject.tasks.splice(i,1);
      Projects.save($scope.projects);
    });
  }

  // A confirm dialog
  $scope.showTaskConfirm = function(onYes, onNo) {
   var confirmPopup = $ionicPopup.confirm({
     title: 'Delete Task',
     template: 'Are you sure you want to delete this task?'
   });
   confirmPopup.then(function(res) {
     if(res) {

       onYes();
     } else {

       if (onNo)
        onNo();
     }
   });
  };

  // A confirm dialog
  $scope.showProjectConfirm = function(onYes, onNo) {
   var confirmPopup = $ionicPopup.confirm({
     title: 'Delete Project',
     template: 'Are you sure you want to delete this project?'
   });
   confirmPopup.then(function(res) {
     if(res) {

       onYes();
     }else{
       if (onNo)
         onNo();
     }
   });
  };

  $scope.newTask = function() {
    $scope.taskModal.show();
  };

  // Open our new task modal
  $scope.editTask = function(i, task) {
    $scope.task = {title: task.title, reminderMinute: task.reminderMinute, reminderHour: task.reminderHour};
    $scope.taskIndex = i;
    $scope.editTaskModal.show();
  };

  $scope.closeNewTask = function() {
    $scope.taskModal.hide();
  }

  $scope.closeEditTask = function() {
    $scope.editTaskModal.hide();
  }

  $scope.toggleProjects = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };


  // Try to create the first project, make sure to defer
  // this by using $timeout so everything is initialized
  // properly
  $timeout(function() {
    if($scope.projects.length == 0) {
      while(true) {
        var projectTitle = prompt('Your first project title:');
        if(projectTitle) {
          createProject(projectTitle);
          break;
        }
      }
    }
  });

});
