import { defApi, routeParam } from '../src/tidy-route'
import { ServerApp } from '../src/tidy-server/server'
import { jsc } from '../src/tidy-schema/schema'

interface Card {
    cardId: number
    text: string
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
        ['/card/', routeParam('catId')],
        {
            body: jsc.obj({
                country: jsc.str().opt(),
                limit: jsc.int().min(10).opt()
            })
        }
    )
}

const server = new ServerApp()
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
    },
    {
        body: jsc.obj({
            add: jsc.obj({
                text: jsc.str()
            })
        })
    }
)

server.listen(3000)


