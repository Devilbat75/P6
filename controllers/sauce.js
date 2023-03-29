//Chemin d'accès aux schémas mongoose
const Sauce = require('../models/Sauce');
//Installation du package FS qui permet d'accéder aux fichiers afin de modifier ou supprimer
const fs = require('fs');

//Création de la route pour creer une sauce
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce enregistrée !' }))
        .catch(error => res.status(400).json({ error }));
};
//Création de la route pour modifier une sauce uniquement pour l'utilisateur l'ayant créé
exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete sauceObject._userId;
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Sauce modifiée!' }))
                    .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

//Création de la route pour supprimer une sauce uniquement pour l'utilisateur l'ayant créé grace au package FS
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Sauce supprimée !' }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

/*Noter une sauce*/
exports.likeSauce = (req, res, next) => {
    //Récupération de la valeur de like
    const likeSauce = req.body.like;
    const validateUserId = req.auth.userId;

    Sauce.findById(req.params.id)
        .then((sauce) => {
            //Ajout d'une appréciation négative
            if (likeSauce === -1) {

                //L'utilisateur a déjà auparavant ajouté une appréciation
                if ((sauce.usersDisliked.includes(validateUserId)) || (sauce.usersLiked.includes(validateUserId))) {
                    res.status(401).json({ message: "Veuillez d'abord enlever votre appréciation" });
                }

                //L'utilisateur n'avait pas encore laissé d'appréciation
                else {
                    //Ajout de l'id utilisateur à la liste des usersDisliked et +1 au total de dislikes
                    Sauce.updateOne({ _id: req.params.id }, {
                        $push: { usersDisliked: validateUserId },
                        $inc: { dislikes: +1 }
                    })
                        .then(() => res.status(200).json({ message: "Dislike ajouté!" }))
                        .catch(error => res.status(401).json({ error }));
                }
            }
            //L'utilisateur choisit de mettre  une note neutre
            if (likeSauce === 0) {

                //L'utilisateur avait auparavant ajouté un like
                if (sauce.usersLiked.includes(validateUserId)) {
                    //Suppression de l'id de l'utilisateur de la liste des usersLiked et retrait de 1 du total des likes
                    Sauce.updateOne({ _id: req.params.id }, {
                        $pull: { usersLiked: validateUserId },
                        $inc: { likes: -1 }
                    }).then(() => res.status(200).json({ message: "Like retiré!" }))
                        .catch(error => res.status(401).json({ error }));
                }

                //L'utilisateur n'avait auparavant pas aimé le produit    
                if (sauce.usersDisliked.includes(validateUserId)) {
                    //Suppression de l'id de l'utilisateur de la liste des usersDisliked et retrait de 1 du total des dislikes
                    Sauce.updateOne({ _id: req.params.id }, {
                        $pull: { usersDisliked: validateUserId },
                        $inc: { dislikes: -1 }
                    })
                        .then(() => res.status(200).json({ message: "Dislike retiré!" }))
                        .catch(error => res.status(401).json({ error }));
                }
                if (!sauce.usersLiked.includes(validateUserId) && !sauce.usersDisliked.includes(validateUserId)) {
                    res.status(401).json({ message: "Vous n'avez pas encore laissé d'appréciation" });
                }

            }

            //L'utilisateur choisit d'ajouter un like    
            if (likeSauce === 1) {

                //L'utilisateur a déjà auparavant ajouté une appréciation
                if ((sauce.usersDisliked.includes(validateUserId)) || (sauce.usersLiked.includes(validateUserId))) {
                    res.status(401).json({ message: "Veuillez d'abord enlever votre appréciation" });
                }

                //L'utilisateur n'avait pas encore laissé d'appréciation        
                else {
                    //Ajout de l'id utilisateur à la liste des usersLiked et +1 au total de likes
                    Sauce.updateOne({ _id: req.params.id }, {
                        $push: { usersLiked: validateUserId },
                        $inc: { likes: +1 }
                    })
                        .then(() => res.status(200).json({ message: "Like ajouté!" }))
                        .catch(error => res.status(401).json({ error }));
                }
            }

        })
        .catch(error => {
            res.status(400).json({ error });
        });
};

//Création de la route pour afficher tableau de toute les sauces
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

//Création de la route pour afficher tableau d'une sauce
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};