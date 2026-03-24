import express from 'express';
const router = express.Router(); 


router.get('/users', (req, res) => {
    const userData = 
    [ // Imagine connecting this to a database
        {
      "id": 1,
      "name": "Leanne Graham",
      "email": "Sincere@april.biz",
      "website": "hildegard.org"
    },
    {
      "id": 2,
      "name": "Ervin Howell",
      "email": "Shanna@melissa.tv",
      "website": "anastasia.net"
    },
    {
      "id": 3,
      "name": "Clementine Bauch",
      "email": "Nathan@yesenia.net",
      "website": "ramiro.info"
    }
    ]

    res.send(userData); 
})

export default router;
