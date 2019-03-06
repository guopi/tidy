import { defApi, pathOf } from '../src/tidy-route'
import { ServerApp } from '../src/tidy-server/server'

interface Card {
    cardId: number
    text: string
}

interface API_Test {
    params: {
        r1?: string
    }
}

interface API_CardList {
    params: {
        catId: number
    }
    body: {
        country?: string,
        limit?: number
    },
    resp: {
        body?: Card[]
    }
}

interface API_CardAdd {
    body: {
        add: {
            text: string
        }
    },
    resp: {
        body: {
            cardId: number
        }
    }
}

const Routes = {
    cardList: defApi<API_CardList>(
        'get',
        pathOf`/card/${'catId'}`
    )
}

const server = new ServerApp({
    useCookie: true,
    upload: {
        tempDir: '/tmp/t1'
    }
})
server.route(Routes.cardList, async req => {
    return [{
        cardId: 999,
        text: '123'
    }]
})

server.onPost<API_CardAdd>(
    '/card/add',
    async req => {
        return {
            cardId: 999
        }
    }
)

server.onAll<API_Test>([pathOf`/test/${'r1'}`, pathOf`/test2/${'r1'}`], async req => {
    return {
        req: req
    }
})

server.listen(3000)
