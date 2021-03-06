const {User} = require('../models/users')
const ctrlFBbot = require('./ctrlFBbot')

function linkApprove(req, res) {

    User.find({}, (err, user) => {
        if (err) {
            console.log('****Loi get link peding data');
            res.render('error');
        }
        
        var pendingLink = [];
        for (var u of user){
            const link = u.link.filter( e => e.state.startsWith('pending'));
            pendingLink = pendingLink.concat(link);
        }
        //console.log('Link truyen zo hom ne: ', links)
        res.render("linkApproveS", { pendingLink});
    })
}

function approveLink (req, res) {
    const {bot, id} = req.params;
    User.findOne({botID: bot}, (err, user) =>{
        const index = user.link.findIndex( e => e.id === id);
        var sharingNote = '';
        const regexNote = /\|(.*)/g;
        const matchNote = regexNote.exec(user.link[index].state)
        if(matchNote) sharingNote = matchNote[1];

        user.link[index].state = 'accepted';
        user.save((err, user) => {
            if(err) console.log(err);
            
            ctrlFBbot.postingFB(user.link[index].address, user, sharingNote, (statusCode) =>{
                if(statusCode === 200) return ctrlFBbot.callSendAPI(bot, 'Duyệt chia sẻ bài viết *' + user.link[index].title + '* lên trang chủ rồi nhé. Truy cập page @tuibittat để thấy bài chia sẻ của bạn :)');
                ctrlFBbot.callSendAPI(bot, 'Không thể chia sẻ bài viết *' + user.link[index].title + '* lên trang chủ vì có lỗi hix');
            });
            res.redirect('/admin/linkApprove');
        })
    })

}
function rejectLink (req, res) {
    const {bot, id} = req.params;
    User.findOne({botID: bot}, (err, user) =>{
        const index = user.link.findIndex( e => e.id === id);
        user.link[index].state = 'reject';
        user.save((err, user) => {
            if(err) console.log(err);
            ctrlFBbot.callSendAPI(bot, 'Từ chối chia sẻ bài viết *' + user.link[index].title + '* lên trang chủ vì nội dung trong tối -_-');
            res.redirect('/admin/linkApprove');
        })
    })

}

module.exports = {linkApprove, approveLink, rejectLink}