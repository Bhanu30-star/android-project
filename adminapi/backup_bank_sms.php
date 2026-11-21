<?php
include("../../connect.php"); 

$response = array();
if(isset($_POST['json_data']))
{
	$json_data = $_POST['json_data'];
	$dist_id = $_POST['dist_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dist_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}

	$cdate  = date("Y-m-d")." ".date('h:i:s');
	$t_date  = date("Y-m-d");
	$t_time  = date('H:i:s');
	$data = json_decode($json_data, true);

	for($j=0 ; $j<count($data) ; $j++) {
		$senderId = $data[$j]['senderId'];
		$body = $data[$j]['body'];

		if($senderId == "SCISMS" || $senderId == "SBIUPI"){
			if (stripos($body, 'credited') !== false) {

				//Your A/C XXXXX807600 Credited INR 5,000.00 on 05/06/20 -Deposit by transfer from Mr. ABHISHEKJAIN. Avl Bal INR 37,571.57

				$message = explode(" ",$body);

				$tmp_date = date_format(date_create($message[7]),"Y-m-d");
				$tmp_amount = str_replace(",","",$message[5]);

				$qur = mysqli_query($con,"INSERT INTO `tbl_bank_txn_sms`(`dist_id`, `sender`, `txn_date`, `txn_amount`, `description`, `type`, `msg_body`, `created_at`) VALUES ('$dist_id', '$senderId', '$tmp_date','$tmp_amount','','Credit','$body','$cdate')");

			}else if (stripos($body, 'debited') !== false){

				//Dear SBI UPI User, ur A/cX5334 - debited by Rs90.0 on 08Jun20 Ref No 016084523622. Download YONO @ www.yonosbi.com
				
				$message = explode(" ",$body);
				$tmp_date = date_format(date_create($message[11]),"Y-m-d");
				$tmp_amount = str_replace("Rs","",$message[9]);

				$qur = mysqli_query($con,"INSERT INTO `tbl_bank_txn_sms`(`dist_id`, `sender`, `txn_date`, `txn_amount`, `description`, `type`, `msg_body`, `created_at`) VALUES ('$dist_id', '$senderId', '$tmp_date','$tmp_amount','','Debit','$body','$cdate')");
			}
		}else if($senderId == "ICICIB"){
		// }else if($senderId == "+918949689594"){
			if (stripos($body, 'credited') !== false) {

				//Dear Customer, acct XX1362 is Credited with Rs.1000 on 2020-06-11 from example@ybl	
				
				$message = explode(" ",$body);

				$tmp_date = date_format(date_create($message[9]),"Y-m-d");
				$tmp_amount = str_replace("Rs.","",$message[7]);
				$tmp_desc = str_replace("Rs.","",$message[11]);

				$qur = mysqli_query($con,"INSERT INTO `tbl_bank_txn_sms`(`dist_id`, `sender`, `txn_date`, `txn_amount`, `description`, `type`, `msg_body`, `created_at`) VALUES ('$dist_id', '$senderId', '$tmp_date','$tmp_amount','$tmp_desc','Credit','$body','$cdate')");

			}
		}else if($senderId == "AxixBk"){
			if (stripos($body, 'credited') !== false) {

				$message = explode(" ",$body);

				if($message[5]=='with'){
					
					//Your A/c 552382 is credited with Rs. 40050 on 11Jun20. Avbl Bal: Rs. 202000.00 Info: BRN-BY Cash Cash
					
					$tmp_date = date_format(date_create($message[9]),"Y-m-d");
					$tmp_amount = $message[7];
					$tmp_desc = "";
				}else if($message[5]=='Rs'){

					//Your A/c 552382 is credited with Rs. 40050 on 11Jun20. Avbl Bal: Rs. 202000.00 Info: BRN-BY Cash Cash
					
					$tmp_date = date_format(date_create($message[8]),"Y-m-d");
					$tmp_amount = $message[6];
					$tmp_desc = "";
				}

				$qur = mysqli_query($con,"INSERT INTO `tbl_bank_txn_sms`(`dist_id`, `sender`, `txn_date`, `txn_amount`, `description`, `type`, `msg_body`, `created_at`) VALUES ('$dist_id', '$senderId', '$tmp_date','$tmp_amount','$tmp_desc','Credit','$body','$cdate')");
			}
		}else if($senderId == "IDFCFB"){
			if (stripos($body, 'credited') !== false) {

				//Your A/C XXXXX442621 has been credited with INR 23,000.00 on 08/06/20 17:56. New balance is INR 25,804.37.	
				
				$message = explode(" ",$body);

				$tmp_date = date_format(date_create($message[10]),"Y-m-d");
				$tmp_amount = str_replace(",","",$message[8]);
				$tmp_desc = "";

				$qur = mysqli_query($con,"INSERT INTO `tbl_bank_txn_sms`(`dist_id`, `sender`, `txn_date`, `txn_amount`, `description`, `type`, `msg_body`, `created_at`) VALUES ('$dist_id', '$senderId', '$tmp_date','$tmp_amount','$tmp_desc','Credit','$body','$cdate')");

			}else if(stripos($body, 'debited') !== false){

				//Your A/C XXXXX442621 has been debited by INR 6,649.05 on 09/06/20 10:36. New balance is INR 35,155.32.To know more, please login to your mobile app or net banking. For raising a dispute, please call our phone banking number.

				$message = explode(" ",$body);

				$tmp_date = date_format(date_create($message[10]),"Y-m-d");
				$tmp_amount = str_replace(",","",$message[8]);
				$tmp_desc = "";

				$qur = mysqli_query($con,"INSERT INTO `tbl_bank_txn_sms`(`dist_id`, `sender`, `txn_date`, `txn_amount`, `description`, `type`, `msg_body`, `created_at`) VALUES ('$dist_id', '$senderId', '$tmp_date','$tmp_amount','$tmp_desc','Debit','$body','$cdate')");
			}
		}else if($senderId == "HDFCHI"){
			if (stripos($body, 'credited') !== false) {

				//Rs. 200.00 credited to a/c XXXXXX2372 on 08-06-20 by a/c linked to VPA vishnuagarwal.p@okicici (UPI Ref No  016014435400).				
				$message = explode(" ",$body);

				$tmp_date = date_format(date_create($message[7]),"Y-m-d");
				$tmp_amount = str_replace(",","",$message[1]);
				$tmp_desc = "";

				$qur = mysqli_query($con,"INSERT INTO `tbl_bank_txn_sms`(`dist_id`, `sender`, `txn_date`, `txn_amount`, `description`, `type`, `msg_body`, `created_at`) VALUES ('$dist_id', '$senderId', '$tmp_date','$tmp_amount','$tmp_desc','Credit','$body','$cdate')");

			}if (stripos($body, 'deposited') !== false) {

				//UPDATE: INR 7,647.00 deposited in A/c XX2372 on 03-JUN-20 for NEFT Cr-CNRB0000169-PATEL ENTERRPISES-KAILASH CHANDRA-P20060399833221.Avl bal:INR 8,384.07 subject to clearing	
				
				$message = explode(" ",$body);

				$tmp_date = date_format(date_create($message[8]),"Y-m-d");
				$tmp_amount = str_replace(",","",$message[2]);
				$tmp_desc = "";

				$qur = mysqli_query($con,"INSERT INTO `tbl_bank_txn_sms`(`dist_id`, `sender`, `txn_date`, `txn_amount`, `description`, `type`, `msg_body`, `created_at`) VALUES ('$dist_id', '$senderId', '$tmp_date','$tmp_amount','$tmp_desc','Credit','$body','$cdate')");

			}else if(stripos($body, 'debited') !== false){

				$message = explode(" ",$body);

				if($message[0]=='Rs' && $message[2]=='debited'){

					//Rs 230.00 debited from a/c **2372 on 07-06-20 to VPA Q63323874@ybl(UPI Ref No 015920520278). Not you? Call on 18002586161 to report

					$tmp_date = date_format(date_create($message[7]),"Y-m-d");
					$tmp_amount = str_replace(",","",$message[1]);
					$tmp_desc = "";
				}else if($message[0]=='Dear' && $message[4]=='debited'){

					//Dear Customer, Rs.9,908.00 is debited from A/c XXXX2372 for BillPay/Credit Card payment via HDFC Bank NetBanking. Call 18002586161 if txn not done by you

					$tmp_date = $t_date;
					$tmp_amount = str_replace("Rs.","",$message[2]);
					$tmp_amount = str_replace(",","",$tmp_amount);
					$tmp_desc = "";
				}

				$qur = mysqli_query($con,"INSERT INTO `tbl_bank_txn_sms`(`dist_id`, `sender`, `txn_date`, `txn_amount`, `description`, `type`, `msg_body`, `created_at`) VALUES ('$dist_id', '$senderId', '$tmp_date','$tmp_amount','$tmp_desc','Debit','$body','$cdate')");
			
			}else if(stripos($body, 'paying') !== false){

				$message = explode(" ",$body);

				//Thanks for paying Rs.1,999.00 from A/c XXXX2372 to AMAZONSELLER1 via NetBanking. Call 18002586161 if txn not done by you
				$tmp_date = $t_date;
				$tmp_amount = str_replace("Rs.","",$message[3]);
				$tmp_amount = str_replace(",","",$tmp_amount);
				$tmp_desc = $message[8];					
				
				$qur = mysqli_query($con,"INSERT INTO `tbl_bank_txn_sms`(`dist_id`, `sender`, `txn_date`, `txn_amount`, `description`, `type`, `msg_body`, `created_at`) VALUES ('$dist_id', '$senderId', '$tmp_date','$tmp_amount','$tmp_desc','Debit','$body','$cdate')");
			}
		}
	}

	$response['success']='1';
	$response['details']="Backup Successfull";
}
else{
	$response['success']='0';
	$response['details']="Unable to add sms. Data is incomplete";
}		
echo json_encode($response);
?>