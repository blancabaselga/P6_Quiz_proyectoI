const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};

// GET /quizzes/randomplay
exports.randomplay = (req, res, next) => {


   if(req.session.randomPlay == undefined ) {  // Array donde voy a almacenar los ids delas preguntas que ya he contestado 
        req.session.randomPlay = [];
    }

    const Op = Sequelize.Op;

    const condicion = {'id': {[Op.notIn]: req.session.randomPlay}};

    models.quiz.count({where: condicion})
    .then(count => {
        if (count === 0) {
            let score = req.session.randomPlay.length;
            delete req.session.randomPlay;
            res.render('quizzes/random_nomore', {
            score : score
            });
        req.session.randomPlay = [];
        } else {
            return models.quiz.findAll({
                where: condicion,
                offset: Math.floor(Math.random() * count), 
                limit: 1 
            })
            .then(quizzes => {
                return quizzes[0];
            });
        
        }
    })
    .then(quiz => {
        res.render('quizzes/random_play', {  
            quiz : quiz,
            score :req.session.randomPlay.length
        });
    })
    .catch(error => next(error));
              
}

// GET /quizzes/:quizId/randomcheck
exports.randomcheck = (req, res, next) => {


    if(req.session.randomPlay == undefined ) {   
        req.session.randomPlay = [];
    }
    const player_answer =  req.query.answer || "";
    const quiz_Answer = req.quiz.answer;     
    var score = req.session.randomPlay.length; 
    var result = player_answer.toLowerCase().trim() === quiz_Answer.toLowerCase().trim();
    

    if(result){
            req.session.randomPlay.push(req.quiz.id) // Añade elementos al final del array.
            score = req.session.randomPlay.length;
    }

    res.render('quizzes/random_result', {   
        score: score, 
        answer: player_answer,
        result: result
    });

};






