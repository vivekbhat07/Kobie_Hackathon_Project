    post {

        success {
            echo "Pipeline succeeded. Image ${env.IMAGE_TAG} is confirmed running in the cluster."
        }

        failure {
            echo "Pipeline FAILED. Image ${env.IMAGE_TAG} was NOT deployed."
        }

    }
}