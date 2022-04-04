package main

import (
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"strconv"

	"github.com/rs/cors"
)

func main() {
	var mux = http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		var err error

		var dump bool
		var length = r.Header.Get("Content-Length")
		if length != "" {
			var len uint64
			if len, err = strconv.ParseUint(r.Header.Get("Content-Length"), 10, 64); err != nil {
				var msg = fmt.Sprintf("Error parsing Content-Length: %s", err)
				log.Println(msg)
				http.Error(w, msg, http.StatusInternalServerError)
				return
			}
			if len < 1024*10 { // lower than 10kb will dump all of the request data
				dump = true
			}
		} else {
			dump = true
		}

		var data []byte
		if data, err = httputil.DumpRequest(r, dump); err != nil {
			var msg = fmt.Sprintf("couldn't dump request: %s", err)
			log.Printf(msg)
			http.Error(w, msg, http.StatusInternalServerError)
			return
		}

		if !dump {
			io.Copy(ioutil.Discard, r.Body) // nolint: errcheck
		}

		fmt.Println("---------------- begin ------------------------")
		log.Printf("request received:\n%s", string(data))
		fmt.Println("---------------- end --------------------------")

		w.Write([]byte(`{"isSuccess": true}`)) // nolint: errcheck
	})

	var handler = cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		Debug:          true,
	}).Handler(mux)

	var addr = fmt.Sprintf(":%d", 8080)

	log.Printf("http-dump is listening at %s\n", addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}
