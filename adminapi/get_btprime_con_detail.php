<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_user_id']) && isset($_POST['distributor_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$session_dist_ver = $_POST['distributor_id'];
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	$credit_advance_amt=0;
	$client_fees_post_credit = mysqli_query($con, "SELECT * FROM tbl_btcw_client_credit_balance WHERE client_id='$session_dist_ver' and credit_balance>0");
	$credit_point_detail = mysqli_fetch_array($client_fees_post_credit);
	if(mysqli_num_rows($client_fees_post_credit)>0)
		$credit_advance_amt=$credit_advance_amt+$credit_point_detail['credit_balance'];
	$response['btprime_coin']=$credit_advance_amt;
	
	$c_i=$final_credit_amt=0;
	$c=1;
	$res_date=array();
	$client_fees_date= mysqli_query($con, "SELECT credit_date,debit_date FROM tbl_btcw_client_credit_transaction,tbl_btcw_client_debit_transaction where tbl_btcw_client_credit_transaction.client_id = tbl_btcw_client_debit_transaction.client_id and  tbl_btcw_client_credit_transaction.client_id='$session_dist_ver' order by credit_date,debit_date asc");
	if(mysqli_num_rows($client_fees_date)>0)
	{ 
		while($fetch_date=mysqli_fetch_assoc($client_fees_date))
		{
			$res_date[$c_i++]=$fetch_date['credit_date'];
			$res_date[$c_i++]=$fetch_date['debit_date'];
		}
		$res_date=array_unique($res_date);
	}
	for($i=0;$i<count($res_date);$i++)
	{
		$coin_ledger_detail=array();
		$client_fees_credit = mysqli_query($con, "SELECT * FROM tbl_btcw_client_credit_transaction,tbl_btcw_distributor_fees where tbl_btcw_client_credit_transaction.fees_id = tbl_btcw_distributor_fees.fees_id and  tbl_btcw_client_credit_transaction.client_id='$session_dist_ver' and tbl_btcw_client_credit_transaction.credit_date='$res_date[$i]'");
		if(mysqli_num_rows($client_fees_credit)>0)
		{     
			while($fetch_product=mysqli_fetch_assoc($client_fees_credit))
			{
				$final_credit_amt=$final_credit_amt+$fetch_product['credit_amount'];
				$coin_ledger_detail['fees_detail'] =  $fetch_product['fees_invoice_id'];
				$coin_ledger_detail['date'] = $fetch_product['credit_date'];
				$coin_ledger_detail['txn_type'] = 'Credit';
				$coin_ledger_detail['credit_amt'] = $fetch_product['credit_amount'];
				$coin_ledger_detail['debit_amt'] = '';
				$coin_ledger_detail['balance_amount'] = $final_credit_amt;
				$response['coin_ledger_detail'][]=$coin_ledger_detail;
			}
		}
		$client_fees_debit = mysqli_query($con, "SELECT * FROM tbl_btcw_client_debit_transaction,tbl_btcw_distributor_fees where tbl_btcw_client_debit_transaction.fees_id = tbl_btcw_distributor_fees.fees_id and  tbl_btcw_client_debit_transaction.client_id='$session_dist_ver' and tbl_btcw_client_debit_transaction.debit_date='$res_date[$i]'");
		if(mysqli_num_rows($client_fees_debit)>0)
		{     
			while($fetch_product=mysqli_fetch_assoc($client_fees_debit))
			{
				$final_credit_amt=$final_credit_amt-$fetch_product['debit_amount'];
				$coin_ledger_detail['fees_detail'] =  $fetch_product['fees_invoice_id'];
				$coin_ledger_detail['date'] = $fetch_product['debit_date'];
				$coin_ledger_detail['txn_type'] = 'Debit';
				$coin_ledger_detail['credit_amt'] = '';
				$coin_ledger_detail['debit_amt'] = $fetch_product['debit_amount'];
				$coin_ledger_detail['balance_amount'] = $final_credit_amt;
				$response['coin_ledger_detail'][]=$coin_ledger_detail;
			}
		}
	}
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required Field Missing";
}	
echo json_encode($response);
?>