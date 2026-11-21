<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	$pid = $_POST['pid'];
	$final_flag=0;
	$cdate1=isset($_POST['cdate1']) ? $_POST['cdate1'] : date("Y-m-d");;
	$cdate2=isset($_POST['cdate2']) ? $_POST['cdate2'] : date("Y-m-d");;
	$debitnote_detail=array();
	
	if($pid>0)
		$res = mysqli_query($con,"select *,sum(tbl_purchase_return_transaction.return_net_amt) as final_bill_amt, sum(tbl_purchase_return_transaction.adjust_amount) as final_adjust_amt from tbl_purchase_return_transaction,tbl_purchase_party where tbl_purchase_return_transaction.party_id=tbl_purchase_party.purchase_party_id and tbl_purchase_return_transaction.distributor_id='$ver' and tbl_purchase_return_transaction.transaction_date>='$cdate1' and tbl_purchase_return_transaction.transaction_date<='$cdate2' and tbl_purchase_return_transaction.party_id='$pid' group by tbl_purchase_return_transaction.bill_no,tbl_purchase_return_transaction.unique_bill");
	else
		$res = mysqli_query($con,"select *,sum(tbl_purchase_return_transaction.return_net_amt) as final_bill_amt, sum(tbl_purchase_return_transaction.adjust_amount) as final_adjust_amt from tbl_purchase_return_transaction,tbl_purchase_party where tbl_purchase_return_transaction.party_id=tbl_purchase_party.purchase_party_id and tbl_purchase_return_transaction.distributor_id='$ver' and tbl_purchase_return_transaction.transaction_date>='$cdate1' and tbl_purchase_return_transaction.transaction_date<='$cdate2' group by tbl_purchase_return_transaction.bill_no,tbl_purchase_return_transaction.unique_bill");
	if(mysqli_num_rows($res)>0)
	{
		$final_flag=1;
		while($fetch_product=mysqli_fetch_array($res)) 
		{ 
			extract($fetch_product);
			if($debit_note_receipt!='')
				$debitnote_detail['debitnote_billno']=$debit_note_receipt;
			else 
				$debitnote_detail['debitnote_billno']="Purchase Return";
			$debitnote_detail['txn_date']=date("d-M-Y", strtotime($transaction_date));
			$debitnote_detail['party_name']=$party_name;
			$debitnote_detail['unique_bill']=$unique_bill;
			$debitnote_detail['party_id']=$party_id;
			$debitnote_detail['billno']=$bill_no;
			$debitnote_detail['bill_date']=date("d-M-Y", strtotime($bill_date))." ".$bill_time;
			$debitnote_detail['bill_amount']=round($final_bill_amt);
			$debitnote_detail['adjust_amount']=round($final_adjust_amt);
			$debitnote_detail['credit_note_type']='Purchase Return';
			$debitnote_detail['pending_amount']=round($final_bill_amt-$final_adjust_amt);
			if(round($final_bill_amt-$final_adjust_amt)>0)
				$debitnote_detail['status']="Pending";
			else
				$debitnote_detail['status']="Complete";
			
			$debitnote_detail['invoice_bill']="debit-notes-receipt.php?id=".base64_encode($unique_bill)."&bid=".base64_encode($bill_no)."&user_id=".base64_encode($ver);
			$response['debitnote_detail'][]=$debitnote_detail;
		}
	}
	if($pid>0)
		$res1 = mysqli_query($con,"select *,sum(tbl_party_debit_note.final_net_amt) as final_bill_amt, sum(tbl_party_debit_note.adjust_amount) as final_adjust_amt from tbl_party_debit_note,tbl_purchase_party where tbl_party_debit_note.purchase_party_id=tbl_purchase_party.purchase_party_id and tbl_party_debit_note.distributor_id='$ver' and tbl_party_debit_note.bill_date>='$cdate1' and tbl_party_debit_note.bill_date<='$cdate2' and tbl_party_debit_note.purchase_party_id='$pid' group by tbl_party_debit_note.bill_no,unique_bill");
	else
		$res1 = mysqli_query($con,"select *,sum(tbl_party_debit_note.final_net_amt) as final_bill_amt, sum(tbl_party_debit_note.adjust_amount) as final_adjust_amt,tbl_purchase_party.purchase_party_id as pid from tbl_party_debit_note,tbl_purchase_party where tbl_party_debit_note.purchase_party_id=tbl_purchase_party.purchase_party_id and tbl_party_debit_note.distributor_id='$ver' and tbl_party_debit_note.bill_date>='$cdate1' and tbl_party_debit_note.bill_date<='$cdate2' group by tbl_party_debit_note.bill_no,unique_bill");
	if(mysqli_num_rows($res1)>0)
	{
		$final_flag=1;
		while($fetch_product1=mysqli_fetch_array($res1)) 
		{ 
			extract($fetch_product1);
			$debitnote_detail['debitnote_billno']=$bill_no;
			$debitnote_detail['txn_date']=date("d-M-Y", strtotime($transaction_date));
			$debitnote_detail['party_name']=$party_name;
			$debitnote_detail['billno']=$bill_no;
			$debitnote_detail['unique_bill']=$unique_bill;
			$debitnote_detail['party_id']=$pid;
			$debitnote_detail['bill_date']=date("d-M-Y", strtotime($bill_date))." ".$bill_time;
			$debitnote_detail['bill_amount']=round($final_bill_amt);
			$debitnote_detail['adjust_amount']=round($final_adjust_amt);
			$debitnote_detail['credit_note_type']=$debit_note_type;
			$debitnote_detail['pending_amount']=round($final_bill_amt-$final_adjust_amt);
			if(round($final_bill_amt-$final_adjust_amt)>0)
				$debitnote_detail['status']="Pending";
			else
				$debitnote_detail['status']="Complete";
			if($debit_note_type=="Direct")
				$debitnote_detail['invoice_bill']="party-debit-note-receipt_direct.php?id=".base64_encode($unique_bill)."&bid=".base64_encode($bill_no)."&user_id=".base64_encode($ver);
			else
				$debitnote_detail['invoice_bill']="party-debit-note-receipt.php?id=".base64_encode($unique_bill)."&bid=".base64_encode($bill_no)."&user_id=".base64_encode($ver);
			
			$response['debitnote_detail'][]=$debitnote_detail;
		}
	}
	if($final_flag=0)
	{
		$response['success']='1';
		$response['details']="No Data Available";
	}
	else
	{
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>