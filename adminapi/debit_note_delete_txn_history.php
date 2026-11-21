<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['cdate1']) && isset($_POST['cdate2']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d");
	$cdate22 = date("Y-m-d");
	$cdate1=isset($_POST['cdate1']) ? $_POST['cdate1'] : $cdate11;
	$cdate2=isset($_POST['cdate2']) ? $_POST['cdate2'] : $cdate22;
	$pid=$_POST['searchparty'];
	$debitnote_detail=array();
	$final_flag=0;
	
	if($pid>0)
		$res = mysqli_query($con,"select *,sum(tbl_purchase_return_transaction_history.return_net_amt) as final_bill_amt, sum(tbl_purchase_return_transaction_history.adjust_amount) as final_adjust_amt, sum(tbl_purchase_return_transaction_history.tcs_Amt) as final_tcs_amt,tbl_purchase_return_transaction_history.insert_datetime as checkflag from tbl_purchase_return_transaction_history, tbl_purchase_party where tbl_purchase_return_transaction_history.party_id=tbl_purchase_party.purchase_party_id and tbl_purchase_return_transaction_history.distributor_id='$session_dist_ver' and tbl_purchase_return_transaction_history.transaction_date>='$cdate1' and tbl_purchase_return_transaction_history.transaction_date<='$cdate2' and tbl_purchase_return_transaction_history.party_id='$pid' and tbl_purchase_return_transaction_history.debit_note='Yes' group by tbl_purchase_return_transaction_history.debit_note_receipt, tbl_purchase_return_transaction_history.unique_bill");
	else
		$res = mysqli_query($con,"select *,sum(tbl_purchase_return_transaction_history.return_net_amt) as final_bill_amt, sum(tbl_purchase_return_transaction_history.adjust_amount) as final_adjust_amt, sum(tbl_purchase_return_transaction_history.tcs_Amt) as final_tcs_amt,tbl_purchase_return_transaction_history.insert_datetime as checkflag from tbl_purchase_return_transaction_history, tbl_purchase_party where tbl_purchase_return_transaction_history.party_id=tbl_purchase_party.purchase_party_id and tbl_purchase_return_transaction_history.distributor_id='$session_dist_ver' and tbl_purchase_return_transaction_history.transaction_date>='$cdate1' and tbl_purchase_return_transaction_history.transaction_date<='$cdate2' and tbl_purchase_return_transaction_history.debit_note='Yes' group by tbl_purchase_return_transaction_history.debit_note_receipt, tbl_purchase_return_transaction_history.unique_bill");
	if(mysqli_num_rows($res)>0)
	{     
		$final_flag=1;
		while($fetch_product1=mysqli_fetch_assoc($res))
		{
			extract($fetch_product1);
			$party_name=$fetch_product1['party_name'];
			$debitnote_detail['txn_date']=$transaction_date;
			$debitnote_detail['party_name']=$party_name;
			$debitnote_detail['billno']=$bill_no;
			$debitnote_detail['unique_bill']=$unique_bill;
			$debitnote_detail['bill_date']=date("d-M-Y", strtotime($bill_date))." ".$bill_time;
			$debitnote_detail['bill_amount']=round($final_bill_amt+$final_tcs_amt);
			$debitnote_detail['adjust_amount']=round($final_adjust_amt);
			$debitnote_detail['pending_amount']=round($final_bill_amt-$final_adjust_amt+$final_tcs_amt);
			$debitnote_detail['credit_note_type']='Purchase Return';
			$response['debitnote_detail'][]=$debitnote_detail;
		}
	}
	
	if($pid>0)
		$res1 = mysqli_query($con,"select *,sum(tbl_party_debit_note_history.final_net_amt) as final_bill_amt, sum(tbl_party_debit_note_history.adjust_amount) as final_adjust_amt, sum(tbl_party_debit_note_history.tcs_amount) as final_tcs_amt from tbl_party_debit_note_history,tbl_purchase_party where tbl_party_debit_note_history.purchase_party_id = tbl_purchase_party.purchase_party_id and tbl_party_debit_note_history.distributor_id='$session_dist_ver' and tbl_party_debit_note_history.purchase_party_id='$pid' and tbl_party_debit_note_history.bill_date>='$cdate1' and tbl_party_debit_note_history.bill_date<='$cdate2' group by tbl_party_debit_note_history.bill_no,tbl_party_debit_note_history.unique_bill");
	else
		$res1 = mysqli_query($con,"select *,sum(tbl_party_debit_note_history.final_net_amt) as final_bill_amt, sum(tbl_party_debit_note_history.adjust_amount) as final_adjust_amt, sum(tbl_party_debit_note_history.tcs_amount) as final_tcs_amt from tbl_party_debit_note_history,tbl_purchase_party where tbl_party_debit_note_history.purchase_party_id = tbl_purchase_party.purchase_party_id and tbl_party_debit_note_history.distributor_id='$session_dist_ver' and tbl_party_debit_note_history.bill_date>='$cdate1' and tbl_party_debit_note_history.bill_date<='$cdate2' group by tbl_party_debit_note_history.bill_no,tbl_party_debit_note_history.unique_bill");
	if(mysqli_num_rows($res1)>0)
	{     
		$final_flag=1;
		while($fetch_product1=mysqli_fetch_assoc($res1))
		{
			extract($fetch_product1);
			$party_name=$fetch_product1['party_name'];
			$debitnote_detail['txn_date']=$transaction_date;
			$debitnote_detail['party_name']=$party_name;
			$debitnote_detail['billno']=$bill_no;
			$debitnote_detail['unique_bill']=$unique_bill;
			$debitnote_detail['bill_date']=date("d-M-Y", strtotime($bill_date))." ".$bill_time;
			$debitnote_detail['bill_amount']=round($final_bill_amt+$final_tcs_amt);
			$debitnote_detail['adjust_amount']=round($final_adjust_amt);
			$debitnote_detail['pending_amount']=round($final_bill_amt-$final_adjust_amt+$final_tcs_amt);
			$debitnote_detail['credit_note_type']=$debit_note_type;
			$response['debitnote_detail'][]=$debitnote_detail;
		}
	}
	if($final_flag==1)
	{
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Data Available";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>