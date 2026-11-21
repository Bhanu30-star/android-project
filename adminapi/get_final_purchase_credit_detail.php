<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
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
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$pur_outstanding_book=array();
	$res_due_amt = mysqli_query($con,"SELECT * FROM tbl_purchase_party where distributor_id='$session_dist_ver' and outstanding_amount>0 and outstanding_amount!=adjusted_outstanding_amt");
    if(mysqli_num_rows($res_due_amt)>0)
    {     
       while($fetch_data=mysqli_fetch_assoc($res_due_amt))
       {
		    $pur_outstanding_book['purchase_party_id']=$fetch_data['purchase_party_id'];
			$pur_outstanding_book['party_name']=$fetch_data['party_name'];
			$pur_outstanding_book['party_phone']=$fetch_data['party_phone'];
			$pur_outstanding_book['txn_detail']='Business Opening Outstanding';
			$pur_outstanding_book['total_amount']=round($fetch_data['outstanding_amount'],2);
			$pur_outstanding_book['paid_amount']=round($fetch_data['adjusted_outstanding_amt'],2);
			$pur_outstanding_book['pending_amount']=round($fetch_data['outstanding_amount']-$fetch_data['adjusted_outstanding_amt'],2);
			$response['pur_outstanding_book'][]=$pur_outstanding_book;
	   }
	}
	$purchasebook=array();
	$res = mysqli_query($con,"SELECT sum(tbl_distributor_transaction.final_net_amt) as bill_final_amt, sum(tbl_distributor_transaction.pay_amount) as paid_amt,tbl_purchase_party.party_name,tbl_purchase_party.purchase_party_id, tbl_purchase_party.party_phone FROM tbl_distributor_transaction,tbl_purchase_party where  tbl_distributor_transaction.party_id = tbl_purchase_party.purchase_party_id and tbl_distributor_transaction.payment_status!='Complete' and tbl_distributor_transaction.payment_mode='Credit' and tbl_purchase_party.distributor_id='$session_dist_ver' group by tbl_distributor_transaction.party_id");
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($res))
		{
			$purchasebook['purchase_party_id']=$fetch_product2['purchase_party_id'];
			$purchasebook['party_name']=$fetch_product2['party_name'];
			$purchasebook['party_phone']=$fetch_product2['party_phone'];
			$purchasebook['txn_detail']='Billing';
			$purchasebook['total_amount']=round($fetch_product2['bill_final_amt'],2);
			$purchasebook['paid_amount']=round($fetch_product2['paid_amt'],2);
			$purchasebook['pending_amount']=round($fetch_product2['bill_final_amt']-$fetch_product2['paid_amt'],2);
			$party_detail=$fetch_product2['purchase_party_id'];
			$res_detail = mysqli_query($con,"SELECT sum(tbl_distributor_transaction.final_net_amt) as bill_final_amt, sum(tbl_distributor_transaction.pay_amount) as paid_amt,tbl_purchase_party.party_name,tbl_purchase_party.purchase_party_id, tbl_distributor_transaction.bill_no,tbl_distributor_transaction.bill_date,tbl_distributor_transaction.transaction_date,tbl_purchase_party.party_phone,tbl_distributor_transaction.unique_bill FROM tbl_distributor_transaction,tbl_purchase_party where tbl_distributor_transaction.party_id=tbl_purchase_party.purchase_party_id and tbl_distributor_transaction.payment_status!= 'Complete' and tbl_distributor_transaction.payment_mode='Credit' and tbl_purchase_party.distributor_id='$session_dist_ver' and tbl_distributor_transaction.party_id='$party_detail' group by tbl_distributor_transaction.unique_bill,bill_no");
			$purchasebook['purchasebookdetail']=array(); 
			if(mysqli_num_rows($res_detail)>0)
            {     
               while($fetch_product11=mysqli_fetch_assoc($res_detail))
               {
					$purchasebookdetail['bill_no']=$fetch_product11['bill_no'];
					$purchasebookdetail['bill_date']=$fetch_product11['bill_date'];
					$purchasebookdetail['unique_bill']=$fetch_product11['unique_bill'];
					$purchasebookdetail['transaction_date']=$fetch_product11['transaction_date'];
					$purchasebookdetail['final_net_amt']=round($fetch_product11['bill_final_amt'],2);
					$purchasebookdetail['pay_amount']=round($fetch_product11['paid_amt'],2);
					$purchasebookdetail['pending_amount']=round($fetch_product11['bill_final_amt']-$fetch_product11['paid_amt'],2);
					$purchasebook['purchasebookdetail'][]=$purchasebookdetail;
			   }
			}
			$response['purchasebook'][]=$purchasebook;
		}
	}
	$response['success']='1';
	$response['details']="Bill Successfully Fetch";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>